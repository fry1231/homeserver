from fastapi.responses import ORJSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from collections import defaultdict
from datetime import datetime, timedelta


class AntiFloodMiddleware(BaseHTTPMiddleware):
    def __init__(self,
                 app,
                 limit=100,
                 graphql_limit=500,
                 per=timedelta(minutes=1)):
        super().__init__(app)
        self.limit = limit
        self.graphql_limit = graphql_limit
        self.per = per
        self.requests = defaultdict(list)
        self.graphql_requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client = request.client.host
        now = datetime.now()

        if request.url.path == '/graphql':
            _requests_log = self.graphql_requests
            limit = self.graphql_limit
        else:
            _requests_log = self.requests
            limit = self.limit

        _requests_log[client] = [
            t for t in _requests_log[client] if t > now - self.per
        ]

        if len(_requests_log[client]) >= limit:
            return ORJSONResponse(
                {
                    "detail": "Too many requests, slow down a bit",
                    "retry-after": int((_requests_log[client][0] + self.per - now).total_seconds())
                },
                status_code=429
            )

        _requests_log[client].append(now)

        return await call_next(request)
