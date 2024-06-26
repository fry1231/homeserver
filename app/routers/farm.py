from fastapi import APIRouter, Security, HTTPException, Depends, Response
from pydantic import BaseModel
from typing import List
import datetime

from security import authorize_user
from misc.dependencies import farm_client, get_redis_conn
from db.influx import get_influx_data, write_influx_data
from misc.data_handling import downsample


router = APIRouter(
    prefix="/farm",
    # dependencies=[Security(authorize_user,)]
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
@router.post('/sensors/submit')
def submit_farm_data(data: FarmData,
                     influxdb_client=Depends(farm_client),
                     auth=Security(authorize_user, scopes=["sensors:write"])):
    write_influx_data(client=influxdb_client,
                      measurement='farm',
                      fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')


@router.get('/sensors/data', response_model=List[FarmResponseItem])
def get_farm_data(startTS: int = int((datetime.datetime.now().timestamp() - 3600 * 24) * 1_000_000_000),
                  endTS: int = int(datetime.datetime.now().timestamp() * 1_000_000_000),
                  influxdb_client=Depends(farm_client),
                  auth=Security(authorize_user, scopes=["sensors:read"])):
    data = get_influx_data(client=influxdb_client,
                           measurement='farm',
                           ResponseClass=FarmResponseItem,
                           start_timestamp=startTS,
                           end_timestamp=endTS)
    return downsample(data)


# Submit and get data about watering pump on/off
@router.post('/watering/submit')
async def submit_watering(data: WateringData,
                          influxdb_client=Depends(farm_client),
                          auth=Security(authorize_user, scopes=["sensors:write"])):
    write_influx_data(client=influxdb_client,
                      measurement='watering',
                      fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')


@router.get('/watering/data', response_model=List[WateringResponseItem])
async def get_watering_data(startTS: int = int((datetime.datetime.now().timestamp() - 3600 * 24) * 1_000_000_000),
                            endTS: int = int(datetime.datetime.now().timestamp() * 1_000_000_000),
                            influxdb_client=Depends(farm_client),
                            auth=Security(authorize_user, scopes=["sensors:read"])):
    return get_influx_data(client=influxdb_client,
                           measurement='watering',
                           ResponseClass=WateringResponseItem,
                           start_timestamp=startTS,
                           end_timestamp=endTS)


@router.get('/watering/last')
def get_last_watering_time(influxdb_client=Depends(farm_client),
                           auth=Security(authorize_user, scopes=["sensors:read"])):
    data: list[WateringResponseItem] = get_influx_data(
        client=influxdb_client,
        measurement='watering',
        ResponseClass=WateringResponseItem,
        start_timestamp=int((datetime.datetime.now().timestamp() - 3600 * 24 * 2) * 1_000_000_000),  # 2 days
        end_timestamp=int(datetime.datetime.now().timestamp() * 1_000_000_000)\
    )
    if len(data) == 0:
        return 0
    time_str = data[-1].time    # "2024-04-01T18:34:45.743561Z"
    time = datetime.datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
    return str(int(time.timestamp()))


@router.post('/watering/set-seconds')
async def set_watering_needed(seconds: int,
                              redis_conn=Depends(get_redis_conn),
                              auth=Security(authorize_user, scopes=["sensors:write"])):
    prev_value = await redis_conn.get('watering_seconds')
    await redis_conn.set('watering_seconds', str(seconds))
    if prev_value is not None and prev_value != '0':
        return Response(status_code=208, content='Set new watering time, but previous has not been consumed yet')
    return Response(status_code=202, content='New watering time set')


@router.get('/watering/seconds')
async def is_watering_needed(noreset: bool = False,
                             redis_conn=Depends(get_redis_conn),
                             auth=Security(authorize_user, scopes=["sensors:read"])) -> int:
    watering_seconds = await redis_conn.get('watering_seconds')
    if watering_seconds is not None:
        if watering_seconds != '0':
            if not noreset:
                await redis_conn.set('watering_seconds', '0')    # Water once and reset the flag
        return int(watering_seconds)
    else:
        return 0
