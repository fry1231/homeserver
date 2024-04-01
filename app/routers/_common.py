from fastapi import WebSocket
from config import logger


class WebsocketConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, text: str, websocket: WebSocket):
        await websocket.send_text(text)

    async def pong(self, websocket: WebSocket):
        await websocket.send_text("pong")

    async def broadcast(self, text: str):
        logger.debug(f"Broadcasting message: {text}")
        for connection in self.active_connections:
            logger.debug(f"Sending message to connection: {connection}")
            await connection.send_text(text)
            logger.debug(f"Message sent to connection: {connection}")
