import aioredis

redis_pool = aioredis.ConnectionPool.from_url("redis://redis", db=1, max_connections=5)
