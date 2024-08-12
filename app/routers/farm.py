from fastapi import APIRouter, Security, HTTPException, Depends, Response, status
from pydantic import BaseModel
from typing import List, TypeVar, Coroutine, Any
import datetime

from config import logger
from security import authorize_user
from dependencies.db_connections import farm_client, get_redis_conn
from dependencies.time_utils import current_time_nanoseconds, day_ago_nanoseconds
from db.influx import get_influx_data, write_influx_data
from misc.data_handling import downsample
from caching import InfluxCache

cache = InfluxCache(timestamp_field='start_timestamp',
                    timestamp_precision='ns')

BaseModelType = TypeVar('BaseModelType', bound=type(BaseModel))

router = APIRouter(
    prefix="/farm",
    # dependencies=[Security(authorize_user,)]
)


class FarmData(BaseModel):
    temperature: float
    soil_moisture: float
    water_level: float


class FarmResponseItem(BaseModel):
    time: str
    temperature: float
    soil_moisture: float
    water_level: float


class WateringData(BaseModel):
    duration: int


class WateringResponseItem(BaseModel):
    time: str
    duration: int


# @cache.fetch(ttl=60 * 15)
async def get_farm_datapoints(client,
                              measurement,
                              start_timestamp,
                              end_timestamp) -> list[dict[str, Any]]:
    return await get_influx_data(**locals())


# @cache.fetch(ttl=60 * 15)
async def get_watering_datapoints(client,
                                  measurement,
                                  start_timestamp,
                                  end_timestamp) -> list[dict[str, Any]]:
    return await get_influx_data(**locals())


# Submit and get data from farm sensors (temperature, soil moisture, water level)
@router.post('/sensors/submit', status_code=status.HTTP_201_CREATED)
async def submit_farm_data(data: FarmData,
                     influxdb_client=Depends(farm_client),
                     auth=Security(authorize_user, scopes=["sensors:write"])):
    # Get last data point
    fifteen_mins_ago = int((datetime.datetime.now().timestamp() - 20 * 60) * 1_000_000_000)
    last_data = await get_farm_datapoints(client=influxdb_client,
                                          measurement='farm',
                                          start_timestamp=fifteen_mins_ago,
                                          end_timestamp=current_time_nanoseconds())
    if len(last_data) == 0:
        await write_influx_data(client=influxdb_client,
                                measurement='farm',
                                fields=data.model_dump())
        return Response(status_code=201, content='Data written to influx')
    else:
        return Response(status_code=208, content='Data already submitted in the last 15 minutes')


@router.get('/sensors/data', response_model=List[FarmResponseItem])
async def get_farm_data(startTS: int = Depends(day_ago_nanoseconds),
                  endTS: int = Depends(current_time_nanoseconds),
                  influxdb_client=Depends(farm_client),
                  auth=Security(authorize_user, scopes=["sensors:read"])):
    data = await get_farm_datapoints(client=influxdb_client,
                                     measurement='farm',
                                     start_timestamp=startTS,
                                     end_timestamp=endTS)
    data = [FarmResponseItem(**item) for item in data]
    return downsample(data)


# Submit and get data about watering pump on/off
@router.post('/watering/submit', status_code=status.HTTP_201_CREATED)
async def submit_watering(data: WateringData,
                          influxdb_client=Depends(farm_client),
                          auth=Security(authorize_user, scopes=["sensors:write"])):
    if data.duration < 0:
        raise HTTPException(status_code=400, detail='Duration must be positive')
    await write_influx_data(client=influxdb_client,
                            measurement='watering',
                            fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')


@router.get('/watering/data', response_model=List[WateringResponseItem])
async def get_watering_data(startTS: int = Depends(day_ago_nanoseconds),
                            endTS: int = Depends(current_time_nanoseconds),
                            influxdb_client=Depends(farm_client),
                            auth=Security(authorize_user, scopes=["sensors:read"])):
    res = await get_watering_datapoints(client=influxdb_client,
                                        measurement='watering',
                                        start_timestamp=startTS,
                                        end_timestamp=endTS)
    return [WateringResponseItem(**item) for item in res]


@router.get('/watering/last', response_model=int)
async def get_last_watering_time(influxdb_client=Depends(farm_client),
                           auth=Security(authorize_user, scopes=["sensors:read"])):
    data = await get_watering_datapoints(
        client=influxdb_client,
        measurement='watering',
        start_timestamp=int((datetime.datetime.now().timestamp() - 3600 * 24 * 2) * 1_000_000_000),  # 2 days
        end_timestamp=current_time_nanoseconds()
    )
    if len(data) == 0:
        return 0
    data = [WateringResponseItem(**item) for item in data]
    time_str = data[-1].time    # "2024-04-01T18:34:45.743561Z"
    time = datetime.datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
    return str(int(time.timestamp()))


@router.post('/watering/set-seconds', status_code=status.HTTP_202_ACCEPTED)
async def set_watering_needed(seconds: int,
                              redis_conn=Depends(get_redis_conn),
                              auth=Security(authorize_user, scopes=["sensors:write"])):
    prev_value = await redis_conn.get('watering_seconds')
    await redis_conn.set('watering_seconds', str(seconds))
    if prev_value is not None and prev_value != '0':
        return Response(status_code=208, content='Set new watering time, but previous has not been consumed yet')
    return Response(status_code=202, content='New watering time set')


@router.get('/watering/seconds', response_model=int)
async def is_watering_needed(noreset: bool = False,
                             redis_conn=Depends(get_redis_conn),
                             auth=Security(authorize_user, scopes=["sensors:read"])) -> int:
    try:
        watering_seconds = await redis_conn.get('watering_seconds')
        if watering_seconds is not None:
            if watering_seconds != '0':
                if not noreset:
                    await redis_conn.set('watering_seconds', '0')    # Water once and reset the flag
            return int(watering_seconds)
        else:
            return 0
    except Exception as e:
        logger.error(f'Failed to get watering seconds: {repr(e)}')
        return 0
