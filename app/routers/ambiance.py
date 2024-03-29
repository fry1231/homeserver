from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import traceback
import pytz

from config import logger
from db.influx import influx_client


router = APIRouter(
    prefix="/ambiance"
)


class AmbianceData(BaseModel):
    room_name: str
    temperature: float
    rel_humidity: Optional[float]


class FarmData(BaseModel):
    temperature: float
    soil_moisture: float
    water_level: float


class FarmResponseItem(FarmData):
    time: str


class AmbianceResponseItem(BaseModel):
    time: str
    temperature: float
    rel_humidity: Optional[float]


class AmbianceResponse(BaseModel):
    room_name: str
    data: List[AmbianceResponseItem]


@router.get('/', response_model=List[AmbianceResponse])
async def get_ambiance_data():
    try:
        data = influx_client.query(
            'SELECT * FROM "home"."autogen"."ambiance" WHERE time > now() - 1d GROUP BY "room_name"')
    except:
        logger.error("Error while getting data from influx:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail=f"Cannot read data from InfluxDB")
    response = []
    try:
        for series in data.raw['series']:
            room_name = series['tags']['room_name']
            columns = series['columns']
            values = series['values']
            items = []
            for point_values in values:
                items.append(AmbianceResponseItem(**{k: v for k, v in zip(columns, point_values)}))
            response.append(AmbianceResponse(room_name=room_name, data=items))
        return response
    except:
        logger.error("Error deserializing influx data:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error deserializing influx data")


@router.get('/farmdata', response_model=List[FarmResponseItem])
async def get_farm_data():
    try:
        data = influx_client.query(
            'SELECT * FROM "home"."autogen"."farm" WHERE time > now() - 14d')
    except:
        logger.error("Error while getting data from influx:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail=f"Cannot read data from InfluxDB")
    response = []
    try:
        for series in data.raw['series']:
            columns = series['columns']
            values = series['values']
            for point_values in values:
                response.append(FarmResponseItem(**{k: v for k, v in zip(columns, point_values)}))
        return response
    except:
        logger.error("Error deserializing influx data:\n", traceback.format_exc())
        raise HTTPException(status_code=503, detail="Error deserializing influx data")


@router.post('/submit')
async def submit_ambiance_point(data: AmbianceData):
    fields = {'temperature': data.temperature}
    if data.rel_humidity is not None:
        fields['rel_humidity'] = data.rel_humidity
    payload = {
        'measurement': 'ambiance',
        'tags': {
            'room_name': data.room_name
        },
        'time': datetime.now().astimezone(tz=pytz.timezone('Europe/Paris')),
        'fields': fields
    }
    if not influx_client.write_points([payload]):
        logger.error("Error writing to influx")
        raise HTTPException(status_code=503, detail='Error writing to InfluxDB')


@router.post('/submit/farm')
async def submit_farm_data(data: FarmData):
    payload = {
        'measurement': 'farm',
        'time': datetime.now().astimezone(tz=pytz.UTC),
        'fields': {
            'temperature': data.temperature,
            'soil_moisture': data.soil_moisture,
            'water_level': data.water_level
        }
    }
    if not influx_client.write_points([payload]):
        logger.error("Error writing to influx")
        raise HTTPException(status_code=503, detail='Error writing to InfluxDB')
