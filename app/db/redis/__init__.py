import aioredis


def get_redis_pool():
    return aioredis.ConnectionPool.from_url("redis://redis", db=1, max_connections=100, decode_responses=True)


redis_pool = get_redis_pool()
