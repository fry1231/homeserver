import traceback
from fastapi import HTTPException
from pydantic import BaseModel
from influxdb import InfluxDBClient
from typing import TypeVar

from config import logger


BaseModelType = TypeVar('BaseModelType', bound=type(BaseModel))


async def get_influx_data(client: InfluxDBClient,
                          measurement: str,
                          response_class: BaseModelType,
                          start_timestamp: int,
                          end_timestamp: int) -> list[BaseModelType]:
    try:
        data = client.query(
            f'SELECT * FROM "{measurement}" '
            f'WHERE time >= {start_timestamp} '
            f'AND time <= {end_timestamp}')
    except:
        logger.error("Error while getting data from influx:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail=f"Cannot read data from InfluxDB")
    response = []
    try:
        for series in data.raw['series']:
            columns = series['columns']
            values = series['values']
            for point_values in values:
                response.append(response_class(**{k: v for k, v in zip(columns, point_values)}))
        return response
    except:
        logger.error("Error deserializing influx data:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error deserializing influx data")


async def write_influx_data(client: InfluxDBClient,
                            measurement: str,
                            fields: dict) -> True:
    try:
        logger.debug(f"Writing to influx: {fields}")
        payload = {
            'measurement': measurement,
            'fields': fields
        }
        if not client.write_points([payload]):
            logger.error("Error writing to influx")
            raise HTTPException(status_code=503, detail='Error writing to InfluxDB')
    except:
        logger.error("Error while writing data to influx:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error writing to InfluxDB")
    return True
