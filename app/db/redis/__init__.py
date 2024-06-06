import aioredis


def init_redis_pool():
    return aioredis.ConnectionPool.from_url("redis://redis", db=1, max_connections=20, decode_responses=True)


redis_pool = init_redis_pool()
