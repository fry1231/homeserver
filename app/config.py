import logging
import os
import sys
from fastapi.templating import Jinja2Templates


templates = Jinja2Templates(directory="templates")
templates.env.globals.update(getenv=os.getenv)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s (%(filename)s:%(lineno)s)',
    datefmt='%d.%m.%Y_%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

IS_TESTING = False if os.getenv('IS_TESTING', default='1') == '0' else False

DOMAIN = 'localhost' if IS_TESTING else os.getenv('DOMAIN')

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = f"https://{DOMAIN}/users/auth/google"

IDF_TOKEN = os.getenv("IDF_TOKEN")

INFLUXDB_HOST = 'influx'
INFLUXDB_PORT = 8086
INFLUXDB_USERNAME = os.getenv('INFLUXDB_USERNAME')
INFLUXDB_PASSWORD = os.getenv('INFLUXDB_PASSWORD')

DATABASE_NAME = 'hs_db'
DATABASE2_NAME = 'db_prod'
POSTGRES_USER = 'postgres' if IS_TESTING else os.getenv("POSTGRES_USER")
POSTGRES_PASS = 'POSTGRES_PASS' if IS_TESTING else os.getenv("POSTGRES_PASS")
POSTGRES_HOST = 'localhost' if IS_TESTING else 'migraine_db'
POSTGRES_PORT = '5433' if IS_TESTING else '5432'
DB_URL = f'postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{DATABASE_NAME}'
DB2_URL = f'postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{DATABASE2_NAME}'

SECRET = 'secret' if IS_TESTING else os.getenv("SECRET")
