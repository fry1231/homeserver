from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime
import pytz

from config import logger
from dependencies import is_admin, farm_client
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


class Watering(BaseModel):
    duration: int


class WateringResponseItem(Watering):
    time: str


@router.get('/farmdata', response_model=List[FarmResponseItem])
async def get_farm_data():
    return get_influx_data(client=farm_client,
                           measurement='farm',
                           days=14,
                           ResponseClass=FarmResponseItem)


@router.get('/watering', response_model=List[WateringResponseItem])
async def get_watering_data(influxdb_client=Depends(farm_client)):
    return get_influx_data(client=influxdb_client,
                           measurement='watering',
                           days=14,
                           ResponseClass=WateringResponseItem)


@router.get('/watering/is-needed')
async def is_watering_needed():
    pass


@router.post('/submit/sensors-data')
async def submit_farm_data(data: FarmData, influxdb_client = Depends(farm_client)):
    write_influx_data(client=influxdb_client,
                      measurement='farm',
                      fields=data.model_dump())


@router.post('/submit/watering')
async def submit_watering(data: Watering, influxdb_client=Depends(farm_client)):
    write_influx_data(client=influxdb_client,
                      measurement='watering',
                      fields=data.model_dump())
