import inspect
from contextlib import AsyncExitStack
from functools import wraps
from typing import Any, Callable, Coroutine, TypeVar, Annotated
import orjson
import aioredis
from fastapi import Request, Depends, HTTPException, Cookie, Query, WebSocketException
from fastapi.dependencies.models import Dependant
from fastapi.dependencies.utils import get_dependant, solve_dependencies
from jose import jwt, JWTError
from starlette import status
from starlette.websockets import WebSocket
import inspect

from config import SECRET, logger
from db.influx import get_influx_client
from db.redis import redis_pool
from db.sql.models import User
from misc.security import oauth2_scheme, ALGORITHM, TokenData, user_authorized


T = TypeVar("T")


class DependencyError(Exception):
    """Exception raised for errors during dependency injection."""
    pass


def injectable(
        func: Callable[..., Coroutine[Any, Any, T]],
) -> Callable[..., Coroutine[Any, Any, T]]:
    """
    © barapa
    https://github.com/tiangolo/fastapi/discussions/7720#discussioncomment-8661497

    A decorator to enable FastAPI-style dependency injection for any asynchronous function.
    This allows dependencies defined with FastAPI's Depends mechanism to be automatically
    resolved and injected into CLI tools or other components, not just web endpoints.
    Args:
        func: The asynchronous function to be wrapped, enabling dependency injection.
    Returns:
        The wrapped function with dependencies injected.
    Raises:
        ValueError: If the dependant.call is not a callable function.
        RuntimeError: If the wrapped function is not asynchronous.
        DependencyError: If an error occurs during dependency resolution.
    """
    @wraps(func)
    async def call_with_solved_dependencies(*args: Any, **kwargs: Any) -> T:  # type: ignore
        dependant: Dependant = get_dependant(path="command", call=func)
        if dependant.call is None or not callable(dependant.call):
            raise ValueError("The dependant.call attribute must be a callable.")

        if not inspect.iscoroutinefunction(dependant.call):
            raise RuntimeError("The decorated function must be asynchronous.")

        param_names = inspect.signature(func).parameters.keys()
        fake_query_params = {}
        if 'start' not in param_names:
            fake_query_params = {k: v for k, v in zip(param_names, args)}
            if fake_query_params:
                fake_query_params["self"] = None
        logger.debug(f"Resolving dependencies for function {func}, args: {args}, kwargs: {kwargs}")
        logger.debug(f"Fake query params: {fake_query_params}")
        fake_request = Request({"type": "http", "headers": [], "query_string": fake_query_params})
        values: dict[str, Any] = {}
        errors: list[Any] = []

        async with AsyncExitStack() as stack:
            solved_result = await solve_dependencies(
                request=fake_request,
                dependant=dependant,
                async_exit_stack=stack,
            )
            values, errors = solved_result[0], solved_result[1]

            if errors:
                error_details = "\n".join([str(error) for error in errors])
                logger.warning(f"Dependency resolution errors from function {func}: {error_details}")

            return await dependant.call(*args, **{**values, **kwargs})

    return call_with_solved_dependencies


# ========= database clients
# influx
home_client = lambda: get_influx_client('home')
farm_client = lambda: get_influx_client('farm')


# redis connection from pool
def get_redis_conn():
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
    if session is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    if token:
        authorized = await user_authorized(token)
        if not authorized:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return True
