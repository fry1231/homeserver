from aiogram import types
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from bot import dp, bot
import crud
from utils import require_auth
from keyboards import generate_del_tasks_kb, generate_change_tasks_kb


@dp.message_handler(commands=['change_state'])
@require_auth
async def change_task_entry(message: types.Message):
    """Conversation entrypoint"""
    kb = generate_change_tasks_kb()
    if kb is None:
        await message.reply('Все задачи выполнены!')
    else:
        await message.reply("Выбери задачу", reply_markup=kb)


@dp.callback_query_handler(lambda c: c.data and c.data.startswith('change_task_id'))
async def process_change(callback_query: types.CallbackQuery):
    """
    Process task id
    """
    user_id = callback_query.from_user.id
    task_id = int(callback_query.data.strip().replace('change_task_id=', ''))
    if crud.mark_finished(task_id=task_id):
        await bot.send_message(user_id, 'Помечено как выполненное', reply_markup=types.ReplyKeyboardRemove())
    else:
        await bot.send_message(user_id, 'Ошибка', reply_markup=types.ReplyKeyboardRemove())
