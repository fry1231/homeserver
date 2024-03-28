import aioredis
import asyncio


redis_conn: aioredis.Redis = aioredis.from_url("redis://redis", db=1, decode_responses=True)
