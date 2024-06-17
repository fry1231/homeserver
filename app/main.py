import asyncio
import datetime
import uvicorn
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.responses import ORJSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import traceback
import orjson
from contextlib import asynccontextmanager
from pydantic import BaseModel, ValidationError

from config import logger, DOMAIN, templates
from routers import (
    buses, states, users, logs, ambiance, farm
)
from security import auth_router
from middlewares import AntiFloodMiddleware, CustomGZipMiddleware
from routers.graphql import graphql_app
from db.sql import database, migraine_database
from routers.buses import BusResponse
from misc.dependencies import get_redis_conn


@asynccontextmanager
async def lifespan(app_: FastAPI):
    database_ = app_.state.database
    if not database_.is_connected:
        await database_.connect()
    if not migraine_database.is_connected:
        await migraine_database.connect()
    asyncio.create_task(buses.retrieve_arrivals())

    yield

    await database_.disconnect()
    await migraine_database.disconnect()


app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)
app.state.database = database
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(auth_router)
# app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(buses.router)
app.include_router(states.router)
app.include_router(logs.router)
app.include_router(graphql_app, prefix="/graphql", include_in_schema=False)
# app.include_router(calendar.router)
app.include_router(ambiance.router)
app.include_router(farm.router)

# Middlewares
# @app.middleware("http")
# async def graphql_playground(request: Request, call_next):
#     return await call_next(request)
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    f"http://{DOMAIN}",
    f"http://{DOMAIN}:8000",
    f"http://{DOMAIN}:3000",
    f"https://{DOMAIN}",
    f"https://{DOMAIN}:8000",
    f"https://{DOMAIN}:3000",
    "http://localhost:3000",
    f"https://hs.{DOMAIN}",
    f"https://homescreen.{DOMAIN}",
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AntiFloodMiddleware, limit=100, per=datetime.timedelta(minutes=1))
app.add_middleware(CustomGZipMiddleware, exclude_routes=['/buses/arrivals'], minimum_size=1000)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    All 422 validation errors converts to user friendly details, that can be shown to the user directly
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


@app.get("/test")
async def test(request: Request):
    logger.info(request)


if __name__ == "__main__":
    uvicorn.run("main:app", host=DOMAIN, port=8000, reload=False)
