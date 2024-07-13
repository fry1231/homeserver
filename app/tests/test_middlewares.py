from fastapi import FastAPI
from fastapi.testclient import TestClient
from middlewares import AntiFloodMiddleware, CustomGZipMiddleware
from datetime import timedelta
from time import time
from math import ceil
from unittest.mock import PropertyMock, patch
import pytest


app = FastAPI()
app.add_middleware(AntiFloodMiddleware, limit=5, per=timedelta(minutes=1))
app.add_middleware(CustomGZipMiddleware, exclude_routes=['/excluded'], minimum_size=1000)
client = TestClient(app)


@app.get("/")
def read_root():
    return {"bimbim": "bambam"}


@app.get("/excluded")
def read_excluded():
    return {"bombom": "bimbim"}


@app.get("/large")
def read_large():
    return {"large": "a" * 1000}


def test_antiflood_middleware():
    with patch('starlette.requests.Request.client', new_callable=PropertyMock) as mock_client:
        mock_client.return_value.host = 'testclient'

        t0 = time()
        # First 5 requests should be successful
        for _ in range(5):
            response = client.get("/")
            assert response.status_code == 200

        # Sixth request should be blocked by the middleware
        response = client.get("/")
        assert response.status_code == 429
        assert response.json() == {
            "detail": "Too many requests, slow down a bit",
            "retry-after": pytest.approx(60, ceil(time() - t0))  # approx 60 seconds
        }


def test_gzip_middleware():
    with patch('starlette.requests.Request.client', new_callable=PropertyMock) as mock_client:
        mock_client.return_value.host = 'anothertestclient'

        # Small response size - no gzip
        response = client.get("/")
        assert response.status_code == 200
        assert "content-encoding" not in {k.lower(): v for k, v in response.headers.items()}

        # Route excluded - no gzip
        response = client.get("/excluded")
        assert response.status_code == 200
        assert "content-encoding" not in {k.lower(): v for k, v in response.headers.items()}

        # Large response size - gzip
        response = client.get("/large")
        assert response.status_code == 200
        assert "content-encoding" in {k.lower(): v for k, v in response.headers.items()}
        cont_enc_key = [k for k in response.headers.keys() if k.lower() == "content-encoding"][0]
        assert response.headers[cont_enc_key] == "gzip"
