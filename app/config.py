import logging
import os
import sys
from fastapi.templating import Jinja2Templates


templates = Jinja2Templates(directory="templates")
templates.env.globals.update(getenv=os.getenv)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s (%(filename)s:%(lineno)s)',
    datefmt='%d.%m.%Y %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

IS_TESTING = bool(int(os.getenv('IS_TESTING', default='1')))

DOMAIN = 'localhost' if IS_TESTING else os.getenv('DOMAIN')

IDF_TOKEN = os.getenv("IDF_TOKEN")

INFLUXDB_HOST = 'influxdb'
INFLUXDB_PORT = 8086
INFLUXDB_USERNAME = os.getenv('INFLUXDB_USERNAME')
INFLUXDB_PASSWORD = os.getenv('INFLUXDB_PASSWORD')

DATABASE_NAME = 'hs_db'
DATABASE2_NAME = 'db_prod'
POSTGRES_USER = 'postgres' if IS_TESTING else os.getenv("POSTGRES_USER")
POSTGRES_PASS = 'POSTGRES_PASS' if IS_TESTING else os.getenv("POSTGRES_PASS")
POSTGRES_HOST = 'localhost' if IS_TESTING else os.getenv("POSTGRES_HOST")
POSTGRES_PORT = '5433' if IS_TESTING else os.getenv("POSTGRES_PORT")
DB_URL = f'postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASS}@' \
         f'{POSTGRES_HOST}:{POSTGRES_PORT}/{DATABASE_NAME}?ssl=false'
DB2_URL = f'postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASS}@' \
          f'{POSTGRES_HOST}:{POSTGRES_PORT}/{DATABASE2_NAME}?ssl=false'


REDIS_HOST = 'redis' if IS_TESTING else os.getenv("REDIS_HOST")
REDIS_PORT = '6379' if IS_TESTING else os.getenv("REDIS_PORT")

SECRET = 'secret' if IS_TESTING else os.getenv("SECRET")
