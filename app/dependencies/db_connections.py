from contextlib import asynccontextmanager

import aioredis

from db.influx import get_influx_client
from db.redis import redis_pool


def home_client():
    client = get_influx_client('home')
    try:
        yield client
    finally:
        client.close()


def farm_client():
    client = get_influx_client('farm')
    try:
        yield client
    finally:
        client.close()


async def get_redis_conn() -> aioredis.Redis:
    redis_conn = aioredis.Redis(connection_pool=redis_pool, decode_responses=True)
    try:
        yield redis_conn
    finally:
        await redis_conn.close()


@asynccontextmanager
async def get_redis_conn_ctx():
    redis_conn = aioredis.Redis(connection_pool=redis_pool, decode_responses=True)
    try:
        yield redis_conn
    finally:
        await redis_conn.close()
