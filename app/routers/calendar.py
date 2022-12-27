from config_init import logger, templates
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


@router.post('/upload/{filename}')
async def update_cal(filename: str, file: UploadFile = File(...)):
    try:
        contents = file.file.read()
        with open(filename, 'wb') as f:
            f.write(contents)
    except Exception:
        logger.error(f"Error handling uploading calendar\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail="Wrong file format")
    finally:
        file.file.close()
