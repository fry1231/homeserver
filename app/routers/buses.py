from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException
from typing import List
import orjson
from pydantic import BaseModel
from requests.auth import HTTPBasicAuth
import requests
import redis.asyncio as redis
import os
from config_init import logger
import asyncio
from httpx import AsyncClient
from arq import create_pool
from arq.connections import RedisSettings
from datetime import datetime, timedelta
import pytz
from config_init import redis_connection
import traceback


router = APIRouter(
    prefix="/buses"
)


class BusArrival(BaseModel):
    route: str
    destination: str
    etd: str


class BusResponse(BaseModel):
    to_defense: List[BusArrival]
    to_rer: List[BusArrival]


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.debug("New connection on buses websocket")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message):
        logger.debug("Broadcasting new data on buses")
        for connection in self.active_connections:
            await connection.send_text(message)
            logger.info(f"Message sent to listener")


buses_manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await buses_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_json()
            await buses_manager.broadcast()
    except WebSocketDisconnect:
        buses_manager.disconnect(websocket)


async def retrieve_arrivals():
    """
    Get bus arrivals, save data to redis 'buses' channel
    """
    while True:
        show_data_rer = []
        show_data_defense = []
        # Disable update during night hours
        current_hour = datetime.now().astimezone(pytz.timezone('Europe/Paris')).hour
        if (1 <= current_hour <= 4) and os.getenv("LOG_LEVEL") != "DEBUG":
            show_data_defense = [
                {
                    "route": "69",
                    "destination": "Время спать, куда ехать собрались?",
                    "etd": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                }
            ]
        else:
            logger.debug("Entered retrieve_arrivals")
            data = []
            try:
                url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopArea:SP:50973:'
                headers = {'Accept': 'application/json', 'apikey': os.getenv("IDF_TOKEN")}
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

                show_data_rer.sort(key=lambda el: datetime.strptime(el.etd, '%Y-%m-%dT%H:%M:%S.%fZ'))
                show_data_defense.sort(key=lambda el: datetime.strptime(el.etd, '%Y-%m-%dT%H:%M:%S.%fZ'))
            except:
                logger.error(traceback.format_exc())
                logger.error(f"IDF data is {data}")
        res = BusResponse(
            to_defense=show_data_defense,
            to_rer=show_data_rer
        )
        try:
            data = orjson.loads(redis_connection.get('data'))
            logger.debug(f"redis data is {data}")
        except orjson.JSONDecodeError:
            logger.error(f'JSONDecodeError while getting buses data from redis: {redis_connection.get("data")}')
            data = None
        if data is None:
            logger.info('Redis data is None, skipping update buses')
        else:
            data['buses'] = res.dict()
            redis_connection.set('data', orjson.dumps(data))
            logger.debug("Published bus arrivals to redis")
        await asyncio.sleep(int(os.getenv("BUSES_REFRESH_TIME")))


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
