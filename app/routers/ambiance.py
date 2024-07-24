from typing import Optional, TypeVar, Any

from fastapi import APIRouter, Depends, Security, Response, status
from pydantic import BaseModel

from caching import InfluxCache
from db.influx import get_influx_data, write_influx_data
from dependencies.db_connections import home_client
from dependencies.time_utils import current_time_nanoseconds, day_ago_nanoseconds
from security import authorize_user

BaseModelType = TypeVar('BaseModelType', bound=type(BaseModel))

router = APIRouter(
    prefix="/ambiance",
)
cache = InfluxCache(timestamp_field='start_timestamp',
                    timestamp_precision='ns')


class AmbianceData(BaseModel):
    room_name: str
    temperature: float
    rel_humidity: Optional[float]


class AmbianceResponseItem(BaseModel):
    time: str
    temperature: float
    rel_humidity: Optional[float]


class AmbianceResponse(BaseModel):
    room_name: str
    data: list[AmbianceResponseItem]


# @cache.fetch(ttl=60 * 5)
async def get_ambiance_datapoints(client,
                                  measurement,
                                  start_timestamp,
                                  end_timestamp) -> list[dict[str, Any]]:
    return await get_influx_data(**locals())


async def write_ambiance_datapoint(client,
                                   measurement,
                                   fields) -> True:
    return await write_influx_data(**locals())


@router.get('/', response_model=list[AmbianceResponse])
async def get_ambiance_data(startTS: int = Depends(day_ago_nanoseconds),
                            endTS: int = Depends(current_time_nanoseconds),
                            influxdb_client=Depends(home_client)):
    items = await get_ambiance_datapoints(client=influxdb_client,
                                          measurement='ambiance',
                                          start_timestamp=startTS,
                                          end_timestamp=endTS)
    items = [AmbianceResponseItem(**item) for item in items]
    response = [AmbianceResponse(room_name='room1', data=items)]
    return response


@router.post('/submit', status_code=status.HTTP_201_CREATED)
async def submit_ambiance_point(data: AmbianceData,
                                influxdb_client=Depends(home_client),
                                auth=Security(authorize_user, scopes=["sensors:write"])):
    await write_ambiance_datapoint(client=influxdb_client,
                                   measurement='ambiance',
                                   fields=data.model_dump())
    return Response(status_code=201, content='Data written to influx')
