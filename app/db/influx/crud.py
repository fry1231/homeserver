import traceback
from fastapi import HTTPException
from pydantic import BaseModel
from influxdb import InfluxDBClient

from config import logger


def get_influx_data(client: InfluxDBClient,
                    measurement: str,
                    ResponseClass: type(BaseModel),
                    days: int,
                    offset: int) -> list[type(BaseModel)]:
    try:
        data = client.query(
            f'SELECT * FROM "{measurement}" '
            f'WHERE time > now() - {days}d - {offset}d '
            f'AND time <= now() - {offset}d')
    except:
        logger.error("Error while getting data from influx:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail=f"Cannot read data from InfluxDB")
    response = []
    try:
        for series in data.raw['series']:
            columns = series['columns']
            values = series['values']
            for point_values in values:
                response.append(ResponseClass(**{k: v for k, v in zip(columns, point_values)}))
        return response
    except:
        logger.error("Error deserializing influx data:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error deserializing influx data")


def write_influx_data(client, measurement: str, fields: dict):
    payload = {
        'measurement': measurement,
        'time': 'now()',
        'fields': fields
    }
    if not client.write_points([payload]):
        logger.error("Error writing to influx")
        raise HTTPException(status_code=503, detail='Error writing to InfluxDB')
