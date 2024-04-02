from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from typing import List
import datetime
import pytz

from config import logger
from dependencies import is_admin, farm_client, get_redis_conn
from db.influx import get_influx_data, write_influx_data


router = APIRouter(
    prefix="/farm",
    dependencies=[Depends(is_admin)]
)


class FarmData(BaseModel):
    temperature: float
    soil_moisture: float
    water_level: float


class FarmResponseItem(FarmData):
    time: str


class WateringData(BaseModel):
    duration: int


class WateringResponseItem(WateringData):
    time: str


# Submit and get data from farm sensors (temperature, soil moisture, water level)
@router.post('/sensors/submit-data')
async def submit_farm_data(data: FarmData, influxdb_client=Depends(farm_client)):
    write_influx_data(client=influxdb_client,
                      measurement='farm',
                      fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')


@router.get('/sensors/data', response_model=List[FarmResponseItem])
async def get_farm_data(days: int = 1, offset: int = 0, influxdb_client=Depends(farm_client)):
    return get_influx_data(client=influxdb_client,
                           measurement='farm',
                           ResponseClass=FarmResponseItem,
                           days=days,
                           offset=offset)


# Submit and get data about watering pump on/off
@router.post('/watering/submit-data')
async def submit_watering(data: WateringData, influxdb_client=Depends(farm_client)):
    write_influx_data(client=influxdb_client,
                      measurement='watering',
                      fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')


@router.get('/watering/data', response_model=List[WateringResponseItem])
async def get_watering_data(days: int = 14, offset: int = 0, influxdb_client=Depends(farm_client)):
    return get_influx_data(client=influxdb_client,
                           measurement='watering',
                           ResponseClass=WateringResponseItem,
                           days=days,
                           offset=offset)


@router.get('/watering/last')
async def get_last_watering_time(influxdb_client=Depends(farm_client)):
    data: list[WateringResponseItem] = get_influx_data(client=influxdb_client,
                                                       measurement='watering',
                                                       ResponseClass=WateringResponseItem,
                                                       days=1,
                                                       offset=0)
    if len(data) == 0:
        raise HTTPException(status_code=404, detail='No watering data found')
    time_str = data[-1].time    # "2024-04-01T18:34:45.743561Z"
    time = datetime.datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
    return str(int(time.timestamp()))



@router.post('/watering/set-needed')
async def set_watering_needed(redis_conn=Depends(get_redis_conn)):
    if await redis_conn.get('watering_needed') == '1':
        return Response(status_code=208, content='Watering needed flag already set')
    await redis_conn.set('watering_needed', '1')
    return Response(status_code=202, content='Watering needed flag set')


@router.get('/watering/is-needed')
async def is_watering_needed(redis_conn=Depends(get_redis_conn)):  # , influxdb_client=Depends(farm_client)):
    watering_needed = await redis_conn.get('watering_needed')   # '1' or '0' or None
    if watering_needed is not None:
        if watering_needed == '1':
            await redis_conn.set('watering_needed', '0')    # Water once and reset the flag
        return watering_needed
    else:
        return '0'


