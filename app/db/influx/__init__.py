from influxdb import InfluxDBClient
from config import INFLUXDB_HOST, INFLUXDB_PASSWORD, INFLUXDB_USERNAME, INFLUXDB_PORT, logger


influx_client = InfluxDBClient(host=INFLUXDB_HOST,
                               port=INFLUXDB_PORT,
                               username=INFLUXDB_USERNAME,
                               password=INFLUXDB_PASSWORD)
if all('home' != el['name'] for el in influx_client.get_list_database()):
    influx_client.create_database('home')
    logger.info('Database home created in InfluxDB')
else:
    logger.info('Database home already exists in InfluxDB')
influx_client.switch_database('home')
