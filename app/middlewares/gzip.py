from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, StreamingResponse
import gzip
import io


class CustomGZipMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, minimum_size: int = 1000, exclude_routes: list = None):
        super().__init__(app)
        self.minimum_size = minimum_size
        self.exclude_routes = exclude_routes or []

    async def dispatch(self, request, call_next):
        # Check if the request path is excluded
        if request.url.path in self.exclude_routes:
            return await call_next(request)

        response = await call_next(request)

        if response.status_code == 200:
            if isinstance(response, StreamingResponse):
                body = b''.join([chunk async for chunk in response.body_iterator])
            else:
                body = await response.body()

            if len(body) >= self.minimum_size:
                gzip_buffer = io.BytesIO()
                with gzip.GzipFile(mode="wb", fileobj=gzip_buffer) as gzip_file:
                    gzip_file.write(body)
                compressed_body = gzip_buffer.getvalue()

                response = Response(compressed_body,
                                    status_code=response.status_code,
                                    headers=dict(response.headers),
                                    media_type=response.media_type)
                response.headers["Content-Encoding"] = "gzip"
                response.headers["Content-Length"] = str(len(compressed_body))

        return response
