from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, \
    InlineKeyboardMarkup, InlineKeyboardButton
import crud


cancel_keyboard = ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
cancel_keyboard.insert(KeyboardButton('Cancel'))


def generate_del_tasks_kb():
    available_tasks = crud.get_tasks()
    if len(available_tasks) == 0:
        return None
    keyboard = InlineKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    for task in available_tasks:
        keyboard.insert(InlineKeyboardButton(task['text'], callback_data=f'del_task_id={task["id"]}'))
    keyboard.add(InlineKeyboardButton('Отменить', callback_data='cancel'))
    return keyboard


def generate_change_tasks_kb():
    available_tasks = crud.get_tasks()
    keyboard = InlineKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    no_tasks = True
    for task in available_tasks:
        if not task['finished']:
            no_tasks = False
            keyboard.insert(InlineKeyboardButton(task['text'], callback_data=f'change_task_id={task["id"]}'))
    keyboard.add(InlineKeyboardButton('Отменить', callback_data='cancel'))
    if no_tasks:
        return None
    return keyboard
