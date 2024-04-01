from influxdb import InfluxDBClient

from config import INFLUXDB_HOST, INFLUXDB_PORT, INFLUXDB_USERNAME, INFLUXDB_PASSWORD, logger


def get_influx_client(db_name: str):
    client: InfluxDBClient = InfluxDBClient(host=INFLUXDB_HOST,
                                            port=INFLUXDB_PORT,
                                            username=INFLUXDB_USERNAME,
                                            password=INFLUXDB_PASSWORD,
                                            database=db_name)
    try:
        logger.debug(f"Opening influx client for {db_name}")
        return client
    finally:
        logger.debug(f"Closing influx client for {db_name}")
        client.close()
