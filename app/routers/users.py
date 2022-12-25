from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException
from db.database import Task, User
from typing import List
from ormar.exceptions import NoMatch
import orjson


router = APIRouter(
    prefix="/users",
    # tags=["items"],
    # dependencies=[Depends(get_token_header)],
    # responses={404: {"description": "Not found"}},
)


@router.get('/', response_model=List[User])
async def get_users():
    users = await User.objects.all()
    return users


@router.get('/user_exists/{telegram_id}')
async def user_exists(telegram_id: int):
    users = await User.objects.all()
    ans = False
    for user in users:
        if user.telegram_id == telegram_id:
            ans = True
    return {"result": ans}


@router.post('/add', response_model=User)
async def add_user(user: User):
    await user.save()
    return user
