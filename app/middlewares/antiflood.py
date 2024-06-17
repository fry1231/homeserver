from fastapi.responses import ORJSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from collections import defaultdict
from datetime import datetime, timedelta


class AntiFloodMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit=100, per=timedelta(minutes=1)):
        super().__init__(app)
        self.limit = limit
        self.per = per
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client = request.client.host
        now = datetime.now()

        self.requests[client] = [
            t for t in self.requests[client] if t > now - self.per
        ]

        if len(self.requests[client]) >= self.limit:
            return ORJSONResponse(
                {"detail": "Too many requests, retry in 1 minute"}, status_code=429
            )

        self.requests[client].append(now)

        return await call_next(request)
