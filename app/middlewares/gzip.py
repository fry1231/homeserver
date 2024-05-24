from starlette.middleware.gzip import GZipMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send


class CustomGZipMiddleware:
    def __init__(self, app: ASGIApp, exclude_routes: list = None, **kwargs):
        self.app = app
        self.exclude_routes = exclude_routes or []
        self.gzip_middleware = GZipMiddleware(app, **kwargs)

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope['type'] == 'http':
            if scope['path'] not in self.exclude_routes:
                await self.gzip_middleware(scope, receive, send)
            else:
                await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)
