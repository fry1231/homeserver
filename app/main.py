from config_init import templates, redis_connection, logger
import uvicorn
from fastapi import FastAPI, Request
# from fastapi.requests import Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from db.database import Task
from typing import List, Dict, Any
from routers import tasks, users, buses
from db.database import database
import redis.asyncio as redis
import os
import asyncio
from utils import get_events
import traceback


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(buses.router)

ws_manager = tasks.manager


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
    logger.debug(f"Ping redis successful: {await redis_connection.ping()}")

    loop2 = asyncio.get_event_loop()
    loop2.create_task(buses.retrieve_arrivals())

    loop3 = asyncio.get_event_loop()
    loop3.create_task(buses.publisher())

    if not database.is_connected:
        await database.connect()


@app.on_event("shutdown")
async def shutdown():
    if database.is_connected:
        await database.disconnect()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
