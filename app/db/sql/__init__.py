import databases
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import asyncio
import asyncpg

from config import (
    DB_URL,
    DB2_URL,
    POSTGRES_USER,
    POSTGRES_PASS,
    DATABASE_NAME,
    DATABASE2_NAME,
    POSTGRES_HOST,
    POSTGRES_PORT,
    logger
)


database = databases.Database(DB_URL)
migraine_database = databases.Database(DB2_URL)

engine = create_async_engine(
    DB_URL,
    # echo=not IN_PRODUCTION
)

migraine_engine = create_async_engine(
    DB2_URL,
)


conn_address = {
    'host': POSTGRES_HOST,
    'port': POSTGRES_PORT,
}


async def connect_create_if_not_exists(user, password, db_name):
    try:
        conn = await asyncpg.connect(user=user, password=password, database=db_name, **conn_address)
        await conn.close()
        logger.info(f'Database {db_name} exists')
    except asyncpg.InvalidCatalogNameError:
        # Database does not exist, create it.
        sys_conn = await asyncpg.connect(
            database='template1',
            user='postgres',
            password=password,
            **conn_address
        )
        await sys_conn.execute(
            f'CREATE DATABASE "{db_name}" OWNER "{user}"'
        )
        await sys_conn.close()

        # Connect to the newly created database.
        conn = await asyncpg.connect(user=user, password=password, database=db_name, **conn_address)
        await conn.close()
        raise ConnectionAbortedError('Database created, now run migrations if needed or restart the app')

try:
    asyncio.get_event_loop().run_until_complete(
        connect_create_if_not_exists(user=POSTGRES_USER, password=POSTGRES_PASS, db_name=DATABASE_NAME)
    )
except ConnectionRefusedError as e:
    raise ConnectionRefusedError(f'Database connection failed. Details: {e}')


# async def database_exists(url):
#     async with engine.begin() as conn:
#         result = await conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{url.database}'"))
#         result = result.fetchone()
#         return bool(result)
#
#
# async def create_database(url):
#     async with engine.begin() as conn:
#         await conn.execute(text("COMMIT"))
#         await conn.execute(text(f"CREATE DATABASE {url.database}"))
#
#
# async def check_db():
#     if not await database_exists(migraine_engine.url):
#         await create_database(migraine_engine.url)
#         logger.info(f"DB {migraine_engine.url} created")
#     else:
#         logger.info(f"Database {migraine_engine.url} already exists")


# loop = asyncio.get_event_loop()
# loop.run_until_complete(check_db())
