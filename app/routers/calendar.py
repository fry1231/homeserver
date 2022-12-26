from config_init import logger, templates
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import
from db.database import Task, User
from typing import List
import orjson
from utils import get_events


router = APIRouter(
    prefix="/calendar",
)


@router.get('/')
async def get_users(request: Request):
    return templates.TemplateResponse('calendar.html', {
        'request': request,
        'events': get_events()
    })


@router.post('/update')
async def update_cal():
    """

    """
    pass