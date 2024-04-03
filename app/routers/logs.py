from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, HTTPException, Depends
import asyncio
import datetime
from pydantic import BaseModel
from typing import Annotated
import async_timeout
import orjson

from db.redis.models import LogsSnapshot, LogUpdate
from db.sql.models import User
from routers import WebsocketConnectionManager
from config import logger
from dependencies import websocket_authorized, get_redis_conn, injectable

router = APIRouter(
    prefix="/logs",
    # tags=["items"],
    # dependencies=[Depends(is_admin)],
    # responses={404: {"description": "Not found"}},
)


class ConnectionManager(WebsocketConnectionManager):
    def __init__(self):
        super().__init__()
        self.listen_updates_task = None
        self.mocked_incr_val = -1
        self.redis_conn = None

    @injectable
    async def init_redis_conn(self, redis_conn=Depends(get_redis_conn)):
        if self.redis_conn is None:
            self.redis_conn = redis_conn

    async def subscribe_to_logs(self):
        await self.init_redis_conn()
        channel = self.redis_conn.pubsub()
        await channel.subscribe('channel:logs')
        while True:
            try:
                async with async_timeout.timeout(1):
                    message = await channel.get_message(ignore_subscribe_messages=True)
                    if message is not None:
                        parsed_message = orjson.loads(message['data'])
                        await self.broadcast(
                            LogUpdate(**parsed_message).model_dump_json()
                        )
                    await asyncio.sleep(0.01)
            except asyncio.TimeoutError:
                pass

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if len(self.active_connections) == 1:
            self.listen_updates_task = asyncio.create_task(self.subscribe_to_logs())
            logger.debug("listen_updates_task was created")

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if len(self.active_connections) == 0:
            try:
                self.listen_updates_task.cancel()
                try:
                    await self.listen_updates_task
                except asyncio.CancelledError:
                    logger.debug("listen_updates_task was cancelled")
            except AttributeError:
                logger.error("listen_updates_task was not created")


@injectable
async def get_logs(start: int, end: int, redis_conn=Depends(get_redis_conn)):
    logs = await redis_conn.lrange('logs', start, end)
    log_incr_value = await redis_conn.get('log_incr_value')
    log_incr_value = int(log_incr_value)
    return LogsSnapshot(log_records=logs, log_incr_value=log_incr_value)


# import random
# def mock_row(minute: int):
#     date = datetime.datetime.now()
#     date = date - datetime.timedelta(minutes=minute)
#     date = date.replace(second=random.randint(0, 59))
#     date = date.strftime('%d.%m.%Y_%H:%M:%S')
#     level = random.choice(["INFO", "DEBUG", "ERROR", "WARNING"])
#     message = random.choice(["User 2132135 logged in", "User 105151661 logged out", "User 516599999 registered",
#                              "User 516151612333 deleted"])
#     randint = random.randint(1, 200)
#     additional = random.choice([f'main.py:{randint}', f'app.py:{randint}', f'routers.py:{randint}'])
#     return f"{date} [{level}] {message} ({additional})"
#
#
# def mock_logs_data(start: int, end: int, incr_val) -> LogsSnapshot:
#     return LogsSnapshot(log_records=[mock_row(minute) for minute in range(start, end)],
#                         log_incr_value=incr_val)
#
#
# def mock_log_update_data(mocked_incr_val: int):
#     return LogUpdate(log_record=mock_row(0), log_incr_value=mocked_incr_val)


manager = ConnectionManager()
# current_logs = mock_logs_data(0, 10, 0)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int, authorized: bool = Depends(websocket_authorized)):
    """
    Websocket endpoint for receiving updates on user states
    Sends logs[0:10] on connection OR logs[start:end] when received "getlogs_{start}_{end}" message
    Otherwise connects to "channel:states" in redis and sends updates on state changes
    :param websocket:
    :param client_id:
    :return:
    """
    try:
        current_logs = await get_logs(0, 50)
        await manager.connect(websocket)
        await manager.send_personal_message(current_logs.model_dump_json(), websocket)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.pong(websocket)
                logger.debug(f"Sent pong to client #{client_id}")
            if data.startswith("getlogs"):
                start, end = data.split("_")[1:]
                start, end = int(start), int(end)
                current_logs = await get_logs(start, end)
                await manager.send_personal_message(current_logs.model_dump_json(), websocket)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
