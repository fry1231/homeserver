from fastapi import APIRouter, Security, WebSocket, WebSocketDisconnect, HTTPException, Depends
import asyncio
import async_timeout
import orjson

from db.redis.models import State, States, StateUpdate
from routers import WebsocketConnectionManager
from config import logger
from misc.dependencies import get_redis_conn, injectable
from security import authorize_user, WebsocketAuthorized


router = APIRouter(
    prefix="/states",
    # tags=["items"],
    dependencies=[Security(authorize_user, scopes=["statistics:read"])],
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

    async def subscribe_to_states(self):
        await self.init_redis_conn()
        logger.debug("Subscribing to channel:states")
        channel = self.redis_conn.pubsub()
        await channel.subscribe('channel:states')
        logger.debug("Subscribed to channel:states")
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


# def mock_states_data():
#     import random
#     states = [State(state_name=f"AddPainCaseForm:{i}:add_medications",
#                     user_ids=[random.randint(1, 10) for _ in range(random.randint(0, 3))]) for i in range(10)]
#     states += [State(state_name="AddDrugForm:0:single_step",
#                      user_ids=[random.randint(1, 10) for _ in range(random.randint(0, 2))]),
#                State(state_name="AddSmth:0:add_pressure",
#                      user_ids=[random.randint(1, 10) for _ in range(random.randint(0, 4))]),
#                State(state_name="AddSmth:1:add_drugname",
#                      user_ids=[random.randint(1, 10) for _ in range(random.randint(0, 5))])]
#     return States(
#         states=states,
#         incr_value=0
#     )
#
#
# def mock_state_update_data(mocked_incr_val: int):
#     import random
#     random_state = random.choice(current_states.states)
#     try:
#         random_user = random.choice(random_state.user_ids)
#         upd = StateUpdate(
#             user_id=random_user,
#             user_state=random_state.state_name,
#             action="unset",
#             incr_value=mocked_incr_val + 1
#         )
#     except IndexError:
#         upd = StateUpdate(
#             user_id=random.randint(1, 10),
#             user_state=random_state.state_name,
#             action="set",
#             incr_value=mocked_incr_val + 1
#         )
#     finally:
#         current_states.incr_value = mocked_incr_val + 1
#         if upd.action == "set":
#             current_states.states[current_states.states.index(random_state)].user_ids.append(upd.user_id)
#         else:
#             current_states.states[current_states.states.index(random_state)].user_ids.remove(upd.user_id)
#         return upd


manager = ConnectionManager()
WSAuth = WebsocketAuthorized(scopes=["statistics:read"])
# current_states = mock_states_data()


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
