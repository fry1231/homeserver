from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import datetime

from db.influx import get_influx_data, write_influx_data
from misc.dependencies import is_admin, home_client


router = APIRouter(
    prefix="/ambiance",
    dependencies=[Depends(is_admin)]
)


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
    data: List[AmbianceResponseItem]


@router.get('/', response_model=List[AmbianceResponse])
def get_ambiance_data(startTS: int = int((datetime.datetime.now().timestamp() - 3600 * 24) * 1_000_000_000),
                      endTS: int = int(datetime.datetime.now().timestamp() * 1_000_000_000),
                      influxdb_client=Depends(home_client)):
    items = get_influx_data(client=influxdb_client,
                            measurement='ambiance',
                            ResponseClass=AmbianceResponseItem,
                            start_timestamp=startTS,
                            end_timestamp=endTS)
    response = [AmbianceResponse(room_name='room1', data=items)]
    return response


@router.post('/submit')
def submit_ambiance_point(data: AmbianceData, influxdb_client=Depends(home_client)):
    write_influx_data(client=influxdb_client,
                      measurement='ambiance',
                      fields=data.model_dump())
