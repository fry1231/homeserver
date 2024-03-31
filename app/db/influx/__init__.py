from influxdb import InfluxDBClient
from influxdb.exceptions import InfluxDBClientError
from config import INFLUXDB_HOST, INFLUXDB_PASSWORD, INFLUXDB_USERNAME, INFLUXDB_PORT, logger
from db.influx.client import InfluxClient
from db.influx.crud import get_influx_data, write_influx_data


influx_client = InfluxDBClient(host=INFLUXDB_HOST,
                               port=INFLUXDB_PORT,
                               username=INFLUXDB_USERNAME,
                               password=INFLUXDB_PASSWORD)

database_list = [el['name'] for el in influx_client.get_list_database()]

retention_policies = {
    'home': '14d',
    'farm': '365d'
}

for db_name in ['home', 'farm']:
    if db_name not in database_list:
        influx_client.create_database(db_name)
        influx_client.create_retention_policy(name=db_name + '_ret_policy',
                                              duration=retention_policies[db_name],
                                              replication='1')
        logger.info(f'Database {db_name} created in InfluxDB')
    else:
        logger.info(f'Database {db_name} already exists in InfluxDB')
        try:
            influx_client.alter_retention_policy(name=db_name + '_ret_policy',
                                                 database=db_name,
                                                 duration=retention_policies[db_name],
                                                 replication=1)
            logger.info(f'Retention policy for {db_name} updated')
        except InfluxDBClientError:
            influx_client.create_retention_policy(name=db_name + '_ret_policy',
                                                  duration=retention_policies[db_name],
                                                  replication='1')
            logger.info(f'Retention policy for {db_name} created')

influx_client.close()
