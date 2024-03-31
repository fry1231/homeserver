from influxdb import InfluxDBClient

from config import INFLUXDB_HOST, INFLUXDB_PORT, INFLUXDB_USERNAME, INFLUXDB_PASSWORD, logger


class InfluxClient:
    def __init__(self, db_name: str):
        self.db_name = db_name
        self.client = InfluxDBClient(host=INFLUXDB_HOST,
                                     port=INFLUXDB_PORT,
                                     username=INFLUXDB_USERNAME,
                                     password=INFLUXDB_PASSWORD,
                                     database=db_name)

    def __call__(self):
        try:
            logger.info(f'Opening connection to InfluxDB database {self.db_name}')
            yield self.client
        finally:
            logger.info(f'Closing connection to InfluxDB database {self.db_name}')
            self.client.close()
