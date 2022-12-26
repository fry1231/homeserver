from fastapi.templating import Jinja2Templates
from logging.config import dictConfig
import logging
from config import LogConfig
import os
import redis


templates = Jinja2Templates(directory="templates")
templates.env.globals.update(getenv=os.getenv)

# dictConfig(LogConfig().dict())
logger = logging.getLogger("uvicorn")
logger.setLevel(os.getenv("LOG_LEVEL"))

# uvicorn_logger = logging.getLogger('uvicorn')
# uvicorn_logger.removeHandler(uvicorn_logger.handlers[0])

redis_connection = redis.Redis(host=os.getenv("REDIS_HOST"), port=6379, db=0)
