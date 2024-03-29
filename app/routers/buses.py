from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.responses import StreamingResponse, Response
from typing import Annotated
import orjson
from pydantic import BaseModel
import requests
import os
from config import logger
import asyncio
# from httpx import AsyncClient
# from arq import create_pool
# from arq.connections import RedisSettings
import datetime
import pytz
import traceback
from db.sql.models import User
from misc.security import is_admin
from config import IDF_TOKEN
from db.redis import redis_conn


router = APIRouter(
    prefix="/buses",
    dependencies=[Depends(is_admin)],
)


class BusArrival(BaseModel):
    route: str
    destination: str
    etd: str


class BusResponse(BaseModel):
    to_defense: list[BusArrival]
    to_rer: list[BusArrival]


async def generate_sse_events():
    while True:
        bus_data = [
                {
                    "destinationName": "Destination 1236",
                    "buses": [
                        {"busNum": 258,
                         "eta": datetime.datetime.now() + datetime.timedelta(minutes=5),
                         "destination": 'Saint-Germain-en-Laye'},
                        {"busNum": 2,
                         "eta": datetime.datetime.now() + datetime.timedelta(minutes=5, seconds=30),
                         "destination": 'La Jonchère'},
                    ]
                },
                {
                    "destinationName": "Destination 454",
                    "buses": [
                        {"busNum": 3,
                         "eta": datetime.datetime.now() + datetime.timedelta(minutes=2, seconds=36),
                         "destination": 'Saint-Denis'},
                        {"busNum": 259,
                         "eta": datetime.datetime.now() + datetime.timedelta(minutes=7, seconds=1),
                         "destination": 'Severodvinsk'},
                    ]
                }
            ]
        yield orjson.dumps({'bus_data': bus_data}).decode('utf8')
        await asyncio.sleep(5)


@router.get("/arrivals")
async def arrivals():
    return StreamingResponse(generate_sse_events(), media_type="text/event-stream")


async def retrieve_arrivals():
    """
    Get bus arrivals, save data to redis 'channel:buses' channel
    """
    while True:
        show_data_rer = []
        show_data_defense = []
        # Disable update during night hours
        current_hour = datetime.datetime.now().astimezone(pytz.timezone('Europe/Paris')).hour
        if 0 <= current_hour <= 5:
            show_data_defense = [
                {
                    "route": "69",
                    "destination": "Ехать некуда! Всем спать!",
                    "etd": (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                }
            ]
        else:
            data = []
            try:
                url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopArea:SP:50973:'
                headers = {'Accept': 'application/json', 'apikey': IDF_TOKEN}
                response = requests.get(url=url, headers=headers)
                data = response.json()

                departures = data['Siri']['ServiceDelivery']['StopMonitoringDelivery'][0]['MonitoredStopVisit']
                for departure in departures:
                    d = {}
                    d['destination'] = departure['MonitoredVehicleJourney']['DestinationName'][0]['value']
                    d['etd'] = departure['MonitoredVehicleJourney']['MonitoredCall']['ExpectedDepartureTime']
                    d['route'] = departure['MonitoredVehicleJourney']['OperatorRef']['value'].split('.')[-1].replace(':', '')

                    d = BusArrival(**d)
                    if '2267' in departure['MonitoringRef']['value']:
                        show_data_rer.append(d)
                    else:
                        show_data_defense.append(d)

                show_data_rer.sort(key=lambda el: datetime.datetime.strptime(el.etd, '%Y-%m-%dT%H:%M:%S.%fZ'))
                show_data_defense.sort(key=lambda el: datetime.datetime.strptime(el.etd, '%Y-%m-%dT%H:%M:%S.%fZ'))
            except:
                logger.error(traceback.format_exc())
                logger.error(f"IDF data is {data}")
        res = BusResponse(
            to_defense=show_data_defense,
            to_rer=show_data_rer
        )
        data = {'buses': res.model_dump()}
        await redis_conn.set('data', orjson.dumps(data))   # for backward compatibility
        await redis_conn.publish('channel:buses', orjson.dumps(data))

        # Sleep time can be changed in Redis
        sleep_seconds = await redis_conn.get('BUSES_REFRESH_TIME')
        if sleep_seconds is None:
            sleep_seconds = os.getenv("BUSES_REFRESH_TIME")
            if sleep_seconds is None:
                sleep_seconds = 90
            await redis_conn.set('BUSES_REFRESH_TIME', sleep_seconds)
        await asyncio.sleep(int(sleep_seconds))


async def reader(conn, channel: redis.client.PubSub):
    while True:
        message = await channel.get_message(ignore_subscribe_messages=True)
        if message is not None:
            logger.info(f"(Reader) Message Received: {message}")
            await conn.broadcast(message['data'].decode('utf8'))


async def publisher():
    async with redis_connection.pubsub() as pubsub:
        await pubsub.subscribe("buses")
        future = asyncio.create_task(reader(buses_manager, pubsub))
        await future
