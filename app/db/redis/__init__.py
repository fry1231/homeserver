import aioredis
import asyncio

redis_conn: aioredis.Redis = asyncio.get_event_loop().run_until_complete(
    aioredis.from_url("redis://redis", db=1, decode_responses=True)
)
