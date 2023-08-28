from config_init import templates, redis_connection, logger
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Any
from routers import tasks, users, buses, calendar, ambiance
from db.database import database, Task
from pydantic import BaseModel
from routers.buses import BusResponse
from pydantic.schema import Optional
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
app.include_router(calendar.router)
app.include_router(ambiance.router)

ws_manager = tasks.manager


class RefreshResponse(BaseModel):
    buses: Optional[BusResponse]
    tasks: Optional[List[Task]]


@app.get('/refresh')
async def master_refresh():
    try:
        res = redis_connection.get('data')
        if res is None:
            return RefreshResponse()
        return RefreshResponse(**orjson.loads(res))
    except:
        logger.error(f"Redis data is {res}")
        logger.error(traceback.format_exc())


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
        # if not database.is_connected:
        #     await database.connect()

        # tasks_ = await Task.objects.all()
        tasks_ = []
        data = redis_connection.get('data')
        if data is None:
            tasks_jsonified = [task.dict() for task in tasks_]
            redis_connection.set('data', orjson.dumps(RefreshResponse(buses=None, tasks=tasks_jsonified).dict()))
            logger.info('Initial data set on redis')

        loop = asyncio.get_event_loop()
        loop.create_task(buses.retrieve_arrivals())
    except:
        logger.error(traceback.format_exc())


@app.on_event("shutdown")
async def shutdown():
    if database.is_connected:
        await database.disconnect()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
