import requests as req
from typing import List
import io


homescreen_url = 'http://homescreen:8000'


def trigger_tasks_update():
    req.post(f'{homescreen_url}/trigger_tasks_update')


def user_validated(telegram_id: int) -> bool:
    res = req.get(f'{homescreen_url}/users/user_exists/{telegram_id}')
    return res.json()['result']


def add_trusted_user(telegram_id: int) -> bool:
    res = req.post(f'{homescreen_url}/users/add',
                   json={"telegram_id": telegram_id})
    if res.status_code == 200:
        return True
    return False


def get_tasks() -> List:
    res = req.get(f'{homescreen_url}/tasks')
    return res.json()


def add_task(text: str) -> bool:
    res = req.post(f'{homescreen_url}/tasks/add',
                   json={"text": text})
    trigger_tasks_update()
    if res.status_code == 200:
        return True
    return False


def mark_finished(task_id: int):
    res = req.put(f'{homescreen_url}/tasks/change_state/{task_id}?is_finished=true')
    trigger_tasks_update()
    if res.status_code == 200:
        return True
    return False


def delete_task(task_id: int) -> bool:
    res = req.delete(f'{homescreen_url}/tasks/delete/{task_id}')
    trigger_tasks_update()
    if res.status_code == 200:
        return True
    return False


def add_calendar(file: io.BytesIO, filename: str) -> bool:
    response = req.post(f'{homescreen_url}/calendar/upload',
                        files={'file': (filename, file)})
    if response.status_code != 200:
        print(response.json())
        return False
    return True
