from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import async_timeout
import orjson

from db.redis.models import State, States, StateUpdate
from routers import WebsocketConnectionManager
from config import logger
from misc.dependencies import get_redis_conn, injectable
from security import WebsocketAuthorized


router = APIRouter(
    prefix="/states",
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

    async def subscribe_to_states(self):
        await self.init_redis_conn()
        channel = self.redis_conn.pubsub()
        await channel.subscribe('channel:states')
        while True:
            try:
                async with async_timeout.timeout(1):
                    message = await channel.get_message(ignore_subscribe_messages=True)
                    if message is not None:
                        parsed_message = orjson.loads(message['data'])
                        await self.broadcast(
                            StateUpdate(**parsed_message).model_dump_json()
                        )
                    await asyncio.sleep(0.01)
            except asyncio.TimeoutError:
                pass

    async def connect(self, websocket: WebSocket, token: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if len(self.active_connections) == 1:
            self.listen_updates_task = asyncio.create_task(self.subscribe_to_states())
            logger.debug("listen_updates_task was created")

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if len(self.active_connections) == 0:
            await self.redis_conn.close()
            try:
                self.listen_updates_task.cancel()
                try:
                    await self.listen_updates_task
                except asyncio.CancelledError:
                    logger.debug("listen_updates_task was cancelled")
            except AttributeError:
                logger.debug("listen_updates_task was not created")


@injectable
async def get_current_states(redis_conn=Depends(get_redis_conn)):
    state_keys = await redis_conn.keys("state:*")
    state_vals = await redis_conn.mget(state_keys)
    states = [
        State(
            state_name=state_key.split(":", maxsplit=1)[1],
            user_ids=orjson.loads(state_val)
        )
        for state_key, state_val in zip(state_keys, state_vals)
    ]
    incr_value = await redis_conn.get("incr_value")
    incr_value = int(incr_value)
    return States(states=states, incr_value=incr_value)


manager = ConnectionManager()
WSAuth = WebsocketAuthorized(scopes=["statistics:read"], master_scope="all")


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket,
                             client_id: int,
                             authorized: bool = Depends(WSAuth)):
    """
    Websocket endpoint for receiving updates on user states
    Sends all states disposition on connection OR when received "refresh_states" message
    Otherwise connects to "channel:states" in redis and sends updates on state changes
    """
    try:
        current_states = await get_current_states()
        await manager.connect(websocket)
        await manager.send_personal_message(current_states.model_dump_json(), websocket)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.pong(websocket)
                logger.debug(f"Sent pong to client #{client_id}")
            if data == "refresh_states":
                current_states = await get_current_states()
                await manager.send_personal_message(current_states.model_dump_json(), websocket)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
