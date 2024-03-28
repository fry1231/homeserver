from config import logger, templates
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile
from db.database import Task, User
from typing import List
import orjson
from utils import get_events
import traceback


router = APIRouter(
    prefix="/calendar",
)


@router.get('/')
async def get_users(request: Request):
    return templates.TemplateResponse('calendar.html', {
        'request': request,
        'events': get_events()
    })


@router.post('/upload')
async def update_cal(file: UploadFile):
    try:
        with open(file.filename, 'wb') as f:
            f.write(await file.read())
    except Exception:
        logger.error(f"Error handling uploading calendar\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail="Wrong file format")
    finally:
        file.file.close()
