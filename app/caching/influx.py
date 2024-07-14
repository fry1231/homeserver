import datetime
import inspect
from functools import wraps
from typing import TypeVar, Callable, Any, Literal, Coroutine

import orjson
from pydantic import BaseModel

from config import logger
from misc.dependencies import get_redis_conn_ctx

BaseModelType = TypeVar('BaseModelType', bound=type(BaseModel))


class InfluxCache:
    """
    Set of decorators for caching InfluxDB data
    """

    def __init__(self,
                 timestamp_field: str,
                 timestamp_precision: Literal['s', 'ms', 'ns'] = 'ns'):
        self.timestamp_field = timestamp_field
        self.timestamp_precision = timestamp_precision

    def fetch(self, ttl: int):
        """
        Decorator.
        Fetch data from Redis cache if available, otherwise call the decorated function
        Availability is determined by the time to live (ttl) of the cache and the last time the cache was updated
        Redis key is f'{func.__name__}_{ts}' where ts is the timestamp rounded down to the nearest reference point

        ! Important: The decorated function must have:
            %timestamp_field% argument with specified %timestamp_precision%
            'response_class' argument
            a unique name for the measurement

        :param ttl: Time to live in seconds
        """

        def decorator(
                func: Callable[..., list[BaseModelType]] or Callable[..., Coroutine[Any, Any, list[BaseModelType]]]):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                async with get_redis_conn_ctx() as redis_conn:
                    # Get supplied arguments to extract 'start_timestamp' value
                    sig = inspect.signature(func)
                    bound_args = sig.bind(*args, **kwargs)
                    bound_args.apply_defaults()
                    function_kwargs: dict[str, Any] = bound_args.arguments

                    if self.timestamp_field not in function_kwargs:
                        raise AttributeError(f"'{self.timestamp_field}' argument is required")
                    if 'response_class' not in function_kwargs:
                        raise AttributeError("'response_class' argument is required")

                    data_model: BaseModelType = function_kwargs['response_class']
                    start_ts: int | float = function_kwargs[self.timestamp_field]
                    previous_ts: int = self._nearest_ref_point(self._normalize_timestamp(start_ts), ttl)
                    key = f"{func.__name__}_{previous_ts}"

                    # Check if data is available in Redis, if so, return it
                    data = await redis_conn.get(key)
                    if data is not None:
                        logger.debug("Data retrieved from cache")
                        return self._deserialize(data)

                    # else: retrieve data from InfluxDB by calling the decorated function
                    result: list[dict[str, Any]]
                    if inspect.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)

                    # Serialize and store the data in Redis
                    await redis_conn.set(key, self._serialize(result), ex=ttl)
                    logger.debug("Data stored in cache")
                    return result

            return wrapper

        return decorator

    def store(self, ttl: int):
        """
        Decorator.
        Store data in Redis cache after calling the decorated function
        Redis key is f'{func.__name__}_{ts}' where ts is the timestamp rounded down to the nearest reference point

        ! Important: The decorated function must have:
            'measurement' argument

        :param ttl: Time to live in seconds
        """

        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                async with get_redis_conn_ctx() as redis_conn:
                    # Get supplied arguments to extract 'measurement' value
                    sig = inspect.signature(func)
                    bound_args = sig.bind(*args, **kwargs)
                    bound_args.apply_defaults()
                    function_kwargs: dict[str, Any] = bound_args.arguments

                    if 'measurement' not in function_kwargs:
                        raise AttributeError('"measurement" argument is required')

                    previous_ts: int = self._nearest_ref_point(datetime.datetime.now().timestamp(), ttl)
                    key = f"{func.__name__}_{previous_ts}"

                    # Retrieve data from InfluxDB by calling the decorated function
                    if inspect.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)

                    if not result:
                        raise ValueError("No data to store, error in writing data to InfluxDB")

                    # Serialize and store the data in Redis
                    serialized_data = self._serialize(result)
                    await redis_conn.set(key, serialized_data, ex=ttl)
                    return True

            return wrapper

        return decorator

    def _normalize_timestamp(self, ts: int) -> int:
        """
        Bring timestamp to the seconds precision
        """
        if self.timestamp_precision == 'ms':
            ts //= 1_000
        elif self.timestamp_precision == 'ns':
            ts //= 1_000_000_000

        # Check if timestamp is valid (precision set correctly)
        try:
            datetime.datetime.fromtimestamp(ts)
        except (OSError, ValueError):
            raise ValueError("Invalid timestamp")

        return ts

    @staticmethod
    def _nearest_ref_point(timestamp: int | float,
                           ttl: int) -> int:
        """
        Get datetime from timestamp and round down to the nearest time point
        :param timestamp: normalized timestamp (seconds)
        :param ttl: time to live in seconds
        """
        return int(timestamp - timestamp % ttl)

    @staticmethod
    def _serialize(data: list[dict[str, Any]]) -> bytes:
        """
        Serialize data to store in Redis
        :return: bytes, representing jsonified list of dicts of model instances
        """
        return orjson.dumps(data)

    @staticmethod
    def _deserialize(data: bytes) -> list[dict[str, Any]]:
        """
        Deserialize data from Redis
        :param data: bytes, representing jsonified list of model instances
        """
        return orjson.loads(data)
