from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, HTTPException
from db.database import Task, User
from typing import List
from config import logger, redis_connection
from ormar.exceptions import NoMatch
import orjson


router = APIRouter(
    prefix="/tasks",
    # tags=["items"],
    # dependencies=[Depends(get_token_header)],
    # responses={404: {"description": "Not found"}},
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    @staticmethod
    async def get_tasks() -> str:
        tasks: List[Task] = await get_tasks()
        tasks_jsonified = [task.dict() for task in tasks]
        return orjson.dumps(tasks_jsonified).decode('utf8')

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await self.send_personal_message(await self.get_tasks(), websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self):
        tasks = await self.get_tasks()
        for connection in self.active_connections:
            await connection.send_text(tasks)


manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_json()
            await manager.broadcast()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def tasks_to_redis():
    tasks: List[Task] = await Task.objects.all()
    tasks_jsonified = [task.dict() for task in tasks]
    data = redis_connection.get('data')
    if data is not None:
        data = orjson.loads(data)
        data['tasks'] = tasks_jsonified
        redis_connection.set('data', orjson.dumps(data))


@router.get('/', response_model=List[Task])
async def get_tasks():
    tasks = await Task.objects.all()
    return tasks


@router.post('/add', response_model=Task)
async def add_task(task: Task):
    await task.save()
    await tasks_to_redis()
    return task


@router.put('/change_state/{task_id}')
async def change_state(task_id: int,
                       is_finished: bool):
    task = await Task.objects.get_or_none(pk=task_id)
    task.finished = is_finished
    res = await task.update()
    await tasks_to_redis()
    return res


@router.delete("/delete/{task_id}")
async def delete_task(task_id: int):
    try:
        item_db = await Task.objects.get_or_none(pk=task_id)
        deleted_rows = await item_db.delete()
        await tasks_to_redis()
        return {"deleted_rows": deleted_rows}
    except NoMatch:
        raise HTTPException(status_code=404, detail=f"Task with id={task_id} not found")
