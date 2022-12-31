from fastapi.templating import Jinja2Templates
from logging.config import dictConfig
import logging
from config import LogConfig
import os
import redis
from influxdb import InfluxDBClient


templates = Jinja2Templates(directory="templates")
templates.env.globals.update(getenv=os.getenv)

# dictConfig(LogConfig().dict())
logger = logging.getLogger("uvicorn")
logger.setLevel(os.getenv("LOG_LEVEL"))

# uvicorn_logger = logging.getLogger('uvicorn')
# uvicorn_logger.removeHandler(uvicorn_logger.handlers[0])

redis_connection = redis.Redis(host=os.getenv("REDIS_HOST"), port=6379, db=0)

influx_client = InfluxDBClient(host=os.getenv('INFLUXDB_HOST'),
                               port=8086,
                               username=os.getenv('INFLUXDB_USERNAME'),
                               password=os.getenv('INFLUXDB_PASSWORD'))
if all('home' != el['name'] for el in influx_client.get_list_database()):
    influx_client.create_database('home')
influx_client.switch_database('home')
