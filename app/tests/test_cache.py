import datetime
from abc import abstractmethod
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient




def override_auth():
    return True


class WithAsyncContextManager:
    async def __aenter__(self, *args, **kwargs):
        return self

    async def __aexit__(self, *args, **kwargs):
        pass

    @abstractmethod
    async def get(self, *args, **kwargs):
        pass

    @abstractmethod
    async def set(self, *args, **kwargs):
        pass


@pytest.fixture
def mock_redis():
    with patch('misc.dependencies.get_redis_conn_ctx', WithAsyncContextManager) as mock_redis:
        yield mock_redis


@pytest.fixture
def mock_influx_client():
    with patch('db.influx.influx_client', MagicMock()):
        yield


@pytest.fixture
def mock_influx():
    with patch('db.influx.get_influx_data', AsyncMock()) as mock_get, \
            patch('db.influx.write_influx_data', AsyncMock()) as mock_write:
        yield mock_get, mock_write


@pytest.fixture
def app(mock_redis, mock_influx, mock_influx_client):
    from security import authorize_user
    from routers import ambiance
    app = FastAPI()
    app.include_router(ambiance.router)
    app.dependency_overrides[authorize_user] = override_auth
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.mark.asyncio
async def test_get_ambiance_data_cache(client, mock_redis, mock_influx):
    # Mock Redis behavior
    mock_redis_conn = mock_redis
    mock_redis_conn.get = AsyncMock()
    mock_redis_conn.get.side_effect = [
        None,
        b"[{\"time\": \"2023-07-13T10:00:00Z\", \"temperature\": 22.5, \"rel_humidity\": 60.0}]"
    ]

    # Mock InfluxDB behavior
    mock_influx_get, mock_influx_write = mock_influx
    mock_influx_get.return_value = [
        {"time": "2023-07-13T10:00:00Z", "temperature": 22.5, "rel_humidity": 60.0}
    ]

    # First request: no cache, should call InfluxDB
    startTS = int((datetime.datetime.now().timestamp() - 3600 * 24) * 1_000_000_000)
    endTS = int(datetime.datetime.now().timestamp() * 1_000_000_000)
    response = client.get(f"/ambiance?startTS={startTS}&endTS={endTS}")
    assert response.status_code == 200
    assert response.json() == [
        {
            "room_name": "room1",
            "data": [{"time": "2023-07-13T10:00:00Z", "temperature": 22.5, "rel_humidity": 60.0}]
        }
    ]
    mock_influx_get.assert_called_once()
    mock_redis_conn.get.assert_called_once()

    # Second request: should hit the cache
    response = client.get(f"/ambiance?startTS={startTS}&endTS={endTS}")
    assert response.status_code == 200
    assert response.json() == [
        {
            "room_name": "room1",
            "data": [{"time": "2023-07-13T10:00:00Z", "temperature": 22.5, "rel_humidity": 60.0}]
        }
    ]
    mock_influx_get.assert_called_once()  # No additional call to InfluxDB
    assert mock_redis_conn.get.call_count == 2
