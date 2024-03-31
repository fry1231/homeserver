from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from db.influx import get_influx_data, write_influx_data
from dependencies import is_admin, home_client

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
async def get_ambiance_data():
    items = get_influx_data(client=home_client,
                            measurement='ambiance',
                            days=1,
                            ResponseClass=AmbianceResponseItem)
    response = [AmbianceResponse(room_name='room1', data=items)]
    return response


@router.post('/submit')
async def submit_ambiance_point(data: AmbianceData):
    write_influx_data(client=home_client,
                      measurement='ambiance',
                      fields=data.model_dump())
