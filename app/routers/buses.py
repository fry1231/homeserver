from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.responses import StreamingResponse, Response
from typing import Annotated
import orjson
from pydantic import BaseModel
import requests
import os
from config import logger
import asyncio
import async_timeout
import datetime
import pytz
import traceback

from dependencies import is_admin, get_redis_conn, injectable
from config import IDF_TOKEN
from misc.utils import delayed_action


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


@router.get("/arrivals")
async def arrivals(redis_conn=Depends(get_redis_conn)):
    return StreamingResponse(reader(redis_conn), media_type="text/event-stream")


@injectable
async def retrieve_arrivals(redis_conn=Depends(get_redis_conn)):
    """
    Get bus arrivals, save data to redis 'data' (data['buses']) and submit it to 'channel:buses'
    """
    logger.info('Starting retrieve_arrivals()')
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
            # Fetch data from IDF API
            data = []
            try:
                url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopArea:SP:50973:'
                headers = {'Accept': 'application/json', 'apikey': IDF_TOKEN}
                response = requests.get(url=url, headers=headers)
                data = response.json()

                # Append each bus to the corresponding list for a destination
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
            except Exception:
                logger.error(traceback.format_exc())
                logger.error(f"IDF data is {data}")
        res = BusResponse(
            to_defense=show_data_defense,
            to_rer=show_data_rer
        )
        data = {'buses': res.model_dump()}

        await redis_conn.set('data', orjson.dumps(data))
        await redis_conn.publish('channel:buses', orjson.dumps(data))

        # Sleep time can be changed in Redis
        if (sleep_seconds := await redis_conn.get('BUSES_REFRESH_TIME')) is None:
            if (sleep_seconds := os.getenv("BUSES_REFRESH_TIME")) is None:
                sleep_seconds = 90
            await redis_conn.set('BUSES_REFRESH_TIME', sleep_seconds)
        await asyncio.sleep(int(sleep_seconds))


@router.post("/boost-refresh-rate")
async def boost_refresh_rate(redis_conn=Depends(get_redis_conn)):
    """Change the refresh rate to 30 seconds. Change it back to 90 seconds after 5 minutes."""
    await redis_conn.set('BUSES_REFRESH_TIME', 30)
    await delayed_action(300, redis_conn.set, 'BUSES_REFRESH_TIME', 90)
    return Response(status_code=200)


async def reader(redis_conn):
    try:
        channel = redis_conn.pubsub()
        await channel.subscribe("channel:buses")

        # Fetch the current data
        current_data = await redis_conn.get('data')
        if current_data is not None:
            data = orjson.loads(current_data)['buses']
            yield reformat_bus_data(data)
        while True:
            try:
                async with async_timeout.timeout(1):
                    message = await channel.get_message(ignore_subscribe_messages=True)
                    if message is not None:
                        data = message['data']
                        yield reformat_bus_data(orjson.loads(data)['buses'])
                await asyncio.sleep(0.1)
            except asyncio.TimeoutError:
                pass
    except Exception:
        logger.error(traceback.format_exc())
        raise


def reformat_bus_data(data):
    to_defense = data['to_defense']
    to_rer = data['to_rer']
    buses_to_defense = [{"busNum": bus['route'], "eta": bus['etd'], "destination": bus['destination']} for bus in to_defense]
    buses_to_rer = [{"busNum": bus['route'], "eta": bus['etd'], "destination": bus['destination']} for bus in to_rer]
    return orjson.dumps({
        "busData": [
            {"destinationName": "Defense", "buses": buses_to_defense},
            {"destinationName": "RER", "buses": buses_to_rer}
        ]
    }).decode('utf8')
