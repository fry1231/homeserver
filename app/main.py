import asyncio
import datetime
import traceback
from contextlib import asynccontextmanager

import orjson
import uvicorn
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ValidationError

from config import (
    logger, 
    DOMAIN, 
    templates, 
    POSTGRES_USER, 
    POSTGRES_PASS, 
    DATABASE_NAME,
    DATABASE2_NAME,
    DB_URL,
    DB2_URL,
    REDIS_HOST,
    REDIS_PORT,
    SECRET,
    IS_TESTING,
    IDF_TOKEN,
    INFLUXDB_HOST,
    INFLUXDB_PORT,
    INFLUXDB_USERNAME,
    INFLUXDB_PASSWORD,
    POSTGRES_HOST,
    POSTGRES_PORT,
)
from db.influx import init_influx
from db.sql import database, migraine_database, connect_create_if_not_exists
from middlewares import AntiFloodMiddleware, CustomGZipMiddleware
from dependencies.db_connections import get_redis_conn
from routers import (
    buses, states, users, logs, ambiance, farm
)
from routers.buses import BusResponse
from routers.graphql import graphql_app
from security import auth_router


@asynccontextmanager
async def lifespan(app_: FastAPI):
    logger.info(f"Starting app with settings:\n"
                f"{IS_TESTING=}\n"
                f"{DOMAIN=}\n"
                f"{IDF_TOKEN=}\n"
                f"{INFLUXDB_HOST=}\n"
                f"{INFLUXDB_PORT=}\n"
                f"{INFLUXDB_USERNAME=}\n"
                f"{INFLUXDB_PASSWORD=}\n"
                f"{DATABASE_NAME=}\n"
                f"{DATABASE2_NAME=}\n"
                f"{POSTGRES_USER=}\n"
                f"{POSTGRES_PASS=}\n"
                f"{POSTGRES_HOST=}\n"
                f"{POSTGRES_PORT=}\n"
                f"{DB_URL=}\n"
                f"{DB2_URL=}\n"
                f"{REDIS_HOST=}\n"
                f"{REDIS_PORT=}\n"
                f"{SECRET=}\n")
    database_ = app_.state.database
    if not database_.is_connected:
        await database_.connect()
    if not migraine_database.is_connected:
        await migraine_database.connect()
    # Initialize the buses data retrieval task
    asyncio.create_task(buses.retrieve_arrivals())
    # Initialize the InfluxDB databases, set retention policies
    init_influx()
    # Connect to homeserver database, create if not exists
    try:
        asyncio.get_event_loop().create_task(
            connect_create_if_not_exists(user=POSTGRES_USER, password=POSTGRES_PASS, db_name=DATABASE_NAME)
        )
    except ConnectionRefusedError as e:
        raise ConnectionRefusedError(f'Database connection failed. Details: {e}')

    yield

    await database_.disconnect()
    await migraine_database.disconnect()


app = FastAPI(lifespan=lifespan,
              default_response_class=ORJSONResponse,
              docs_url=None,
              redoc_url=None)
app.state.database = database
app.mount("/static", StaticFiles(directory="static"), name="static")

# Middlewares
# @app.middleware("http")
# async def graphql_playground(request: Request, call_next):
#     return await call_next(request)

origins = [
    f"https://hs.{DOMAIN}",
    f"https://homescreen.{DOMAIN}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AntiFloodMiddleware, limit=100, graphql_limit=500, per=datetime.timedelta(minutes=1))
app.add_middleware(CustomGZipMiddleware, exclude_routes=['/buses/arrivals'], minimum_size=1000)

app.include_router(auth_router, tags=["auth"])
# app.include_router(tasks.router)
app.include_router(users.router, tags=["users"])
app.include_router(buses.router, tags=["buses"])
app.include_router(states.router, tags=["states"])
app.include_router(logs.router, tags=["logs"])
app.include_router(graphql_app, prefix="/graphql", include_in_schema=False)
# app.include_router(calendar.router)
app.include_router(ambiance.router, tags=["ambiance"])
app.include_router(farm.router, tags=["farm"])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    All 422 validation errors convert to user-friendly details, that can be shown to the user directly
    """
    error_messages = [err['msg'].replace('Assertion failed, ', '') for err in exc.errors()]
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="\n".join(error_messages)
    )


class RefreshResponse(BaseModel):
    buses: BusResponse | None
    # tasks: List[Task] | None


@app.get('/refresh')   # backward compatibility
async def master_refresh(redis_conn=Depends(get_redis_conn)):
    res = None
    try:
        res = await redis_conn.get('data')
        if res is None:
            return RefreshResponse(buses=None)
        return RefreshResponse(**orjson.loads(res))
    except ValidationError as e:
        logger.error(f"Redis data is {res}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=503, detail="Cannot read data from Redis")
    except:
        logger.error(f"Redis data is {res}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error while deserializing data")


@app.get("/")
async def index(request: Request):
    try:
        return templates.TemplateResponse("main.html",
                                          {'request': request, 'events': []})  # get_events()})
    except:
        logger.error(traceback.format_exc())


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=DOMAIN, port=8000, reload=False)
