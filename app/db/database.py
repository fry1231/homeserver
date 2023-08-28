import sqlalchemy
import databases
import ormar
from ormar import Integer, String, Date, Boolean
from datetime import date
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import database_exists, create_database
import logging
import os
from pydantic import BaseModel
from pydantic.schema import Optional, List, Dict


# if 'C:\\WINDOWS\\system32' in os.getenv('path'):  # for running offline migrations
#     os.putenv("DATABASE_URL", "localhost")
#     os.putenv("POSTGRES_USER", "admin")
#     os.putenv("POSTGRES_PASS", "admin")

DATABASE_NAME = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
db_url = f'postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@db:5432/{DATABASE_NAME}'

database = databases.Database(db_url)
metadata = sqlalchemy.MetaData()


class BaseMeta(ormar.ModelMeta):
    metadata = metadata
    database = database


class Task(ormar.Model):
    class Meta(BaseMeta):
        tablename = 'tasks'
    id = Integer(primary_key=True)
    text = String(nullable=False, max_length=256)
    finished = Boolean(default=False)


class User(ormar.Model):
    class Meta(BaseMeta):
        tablename = 'users'
    telegram_id = Integer(primary_key=True)


# engine = sqlalchemy.create_engine(db_url)
#
# logging.info(f"DB {db_url} connected")
