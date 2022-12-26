from config_init import templates, redis_connection, logger
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Any
from routers import tasks, users, buses
from db.database import database, RefreshResponse, Task
import os
import asyncio
from utils import get_events
import traceback
import orjson


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(buses.router)

ws_manager = tasks.manager


@app.get('/refresh')
async def master_refresh():
    res = redis_connection.get('data')
    if res is None:
        return RefreshResponse()
    return RefreshResponse(**res)


@app.get("/")
async def index(request: Request):
    try:
        return templates.TemplateResponse("main.html",
                                          {'request': request, 'events': get_events()})
    except:
        logger.error(traceback.format_exc())


@app.post("/trigger_tasks_update", status_code=200)
async def trigger():
    await ws_manager.broadcast()


@app.on_event("startup")
async def startup():
    try:
        # logger.debug(f"Ping redis successful: {await redis_connection.ping()}")

        loop = asyncio.get_event_loop()
        loop.create_task(buses.retrieve_arrivals())

        tasks_ = await Task.objects.all()
        data = redis_connection.get('data')
        if data is None:
            tasks_jsonified = [task.dict() for task in tasks_]
            redis_connection.set('data', orjson.dumps(RefreshResponse(buses=None, tasks=tasks_jsonified).dict()))
            logger.info('Initial data set on redis')
        # loop3 = asyncio.get_event_loop()
        # loop3.create_task(buses.publisher())

        if not database.is_connected:
            await database.connect()
    except:
        logger.error(traceback.format_exc())


@app.on_event("shutdown")
async def shutdown():
    if database.is_connected:
        await database.disconnect()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
