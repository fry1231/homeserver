from contextlib import AsyncExitStack, asynccontextmanager, contextmanager
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
from security.config import ALGORITHM, oauth2_scheme
from security.authorization import authorize_user

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
        # if 'start' not in param_names:
        #     fake_query_params = {k: v for k, v in zip(param_names, args)}
        #     if fake_query_params:
        #         fake_query_params["self"] = None
        # logger.debug(f"Resolving dependencies for function {func}, args: {args}, kwargs: {kwargs}")
        # logger.debug(f"Fake query params: {fake_query_params}")
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
def home_client():
    client = get_influx_client('home')
    try:
        yield client
    finally:
        client.close()


def farm_client():
    client = get_influx_client('farm')
    try:
        yield client
    finally:
        client.close()


# redis connection from pool
async def get_redis_conn():
    redis_conn = aioredis.Redis(connection_pool=redis_pool, decode_responses=True)
    try:
        yield redis_conn
    finally:
        await redis_conn.close()
