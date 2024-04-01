from typing import Annotated

import orjson
import aioredis
from fastapi import Depends, HTTPException, Cookie, Query, WebSocketException
from jose import jwt, JWTError
from starlette import status
from starlette.websockets import WebSocket

from config import SECRET, logger
from db.influx import get_influx_client
from db.redis import redis_pool
from db.sql.models import User
from misc.security import oauth2_scheme, ALGORITHM, TokenData, user_authorized


# ========= database clients
# influx
home_client = lambda: get_influx_client('home')
farm_client = lambda: get_influx_client('farm')


n = 0
# redis
def get_redis_conn():
    global n
    n += 1
    logger.debug(f"Got redis connection {n}")
    redis_conn = aioredis.Redis(connection_pool=redis_pool, decode_responses=True)
    return redis_conn


# ========= security dependencies
async def is_authorized(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        user_props = orjson.loads(payload.get("sub"))
        uuid = user_props.get("uuid")
        is_admin = user_props.get("is_admin")
        if uuid is None:
            raise credentials_exception
        token_data = TokenData(uuid=uuid, is_admin=is_admin)
    except JWTError:
        raise credentials_exception
    user = await User.objects.get_or_none(uuid=token_data.uuid)
    if user is None:
        raise credentials_exception
    return user


async def is_admin(
        current_user: Annotated[User, Depends(is_authorized)]
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )
    return current_user


async def websocket_authorized(
        websocket: WebSocket,
        session: Annotated[str | None, Cookie()] = None,
        token: Annotated[str | None, Query()] = None,
):
    logger.debug("Websocket authorization")
    if session is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    if token:
        authorized = await user_authorized(token)
        if not authorized:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    logger.debug("Websocket authorized")
    return True
