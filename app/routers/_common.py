from fastapi import WebSocket, WebSocketException, status
from config import logger
import asyncio
from misc.security import user_authorized


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
        for connection in self.active_connections:
            await connection.send_text(text)
