from influxdb import InfluxDBClient

from config import INFLUXDB_HOST, INFLUXDB_PORT, INFLUXDB_USERNAME, INFLUXDB_PASSWORD, logger


def get_influx_client(db_name: str):
    client: InfluxDBClient = InfluxDBClient(host=INFLUXDB_HOST,
                                            port=INFLUXDB_PORT,
                                            username=INFLUXDB_USERNAME,
                                            password=INFLUXDB_PASSWORD,
                                            database=db_name)
    try:
        return client
    except:
        logger.error(f"Error while creating influx client for {db_name}")
        raise
    finally:
        client.close()
