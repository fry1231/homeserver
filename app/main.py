import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from typing import List, Dict, Any
import asyncio
import traceback
import orjson
from contextlib import asynccontextmanager
from pydantic import BaseModel
import os

from config import logger, DOMAIN
from routers import (
    buses, states, users, logs, ambiance
)
from routers.graphql import graphql_app
from db.sql import database, migraine_database
from db.redis import redis_conn
from routers.buses import BusResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_ = app.state.database
    if not database_.is_connected:
        await database_.connect()
    if not migraine_database.is_connected:
        await migraine_database.connect()

    yield

    await database_.disconnect()
    await migraine_database.disconnect()


templates = Jinja2Templates(directory="templates")
templates.env.globals.update(getenv=os.getenv)

app = FastAPI(lifespan=lifespan)
app.state.database = database
app.mount("/static", StaticFiles(directory="static"), name="static")
# app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(buses.router)
app.include_router(states.router)
app.include_router(logs.router)
app.include_router(graphql_app, prefix="/graphql", include_in_schema=False)
# app.include_router(calendar.router)
app.include_router(ambiance.router)


# @app.middleware("http")
# async def graphql_playground(request: Request, call_next):
#     return await call_next(request)


origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    f"http://{DOMAIN}",
    f"http://{DOMAIN}:8000",
    f"http://{DOMAIN}:5173",
    f"https://{DOMAIN}",
    f"https://{DOMAIN}:8000",
    f"https://{DOMAIN}:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RefreshResponse(BaseModel):
    buses: BusResponse | None
    # tasks: List[Task] | None


@app.get('/refresh')   # backward compatibility
async def master_refresh():
    try:
        res = await redis_conn.get('data')
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


# @app.post("/trigger_tasks_update", status_code=200)
# async def trigger():
#     await ws_manager.broadcast()


# @app.on_event("startup")
# async def startup():
#     try:
#         pass
#         # if not database.is_connected:
#         #     await database.connect()
#
#         # tasks_ = await Task.objects.all()
#         # tasks_ = []
#         # data = redis_connection.get('data')
#         # if data is None:
#         #     tasks_jsonified = [task.dict() for task in tasks_]
#         #     redis_connection.set('data', orjson.dumps(RefreshResponse(buses=None, tasks=tasks_jsonified).dict()))
#         #     logger.info('Initial data set on redis')
#         #
#         # loop = asyncio.get_event_loop()
#         # loop.create_task(buses.retrieve_arrivals())
#     except:
#         logger.error(traceback.format_exc())



if __name__ == "__main__":
    uvicorn.run("main:app", host=DOMAIN, port=8000, reload=False)
