import aioredis
from config import REDIS_HOST, REDIS_PORT


def init_redis_pool():
    return aioredis.ConnectionPool.from_url(f"redis://{REDIS_HOST}:{REDIS_PORT}", db=1, decode_responses=True)


redis_pool = init_redis_pool()
