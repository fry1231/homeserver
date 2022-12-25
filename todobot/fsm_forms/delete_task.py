from aiogram import types
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from bot import dp, bot
import crud
from utils import require_auth
from keyboards import generate_del_tasks_kb


@dp.callback_query_handler(lambda c: c.data and c.data == 'cancel')
async def cancelled_callback(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    await bot.send_message(user_id, 'Отменено', reply_markup=types.ReplyKeyboardRemove())


@dp.message_handler(commands=['delete_task'])
@require_auth
async def del_task_entry(message: types.Message):
    """Conversation entrypoint"""
    kb = generate_del_tasks_kb()
    if kb is None:
        await message.reply('Нет задач!')
    else:
        await message.reply("Выбери задачу для удаления:", reply_markup=kb)


@dp.callback_query_handler(lambda c: c.data and c.data.startswith('del_task_id'))
async def process_del(callback_query: types.CallbackQuery):
    """
    Process task id
    """
    user_id = callback_query.from_user.id
    task_id = int(callback_query.data.strip().replace('del_task_id=', ''))
    if crud.delete_task(task_id=task_id):
        await bot.send_message(user_id, 'Успешно удалено!', reply_markup=types.ReplyKeyboardRemove())
    else:
        await bot.send_message(user_id, 'Ошибка при удалении', reply_markup=types.ReplyKeyboardRemove())
