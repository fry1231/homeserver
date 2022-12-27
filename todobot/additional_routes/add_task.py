from aiogram import types
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters import Text
from aiogram.dispatcher.filters.state import State, StatesGroup
from bot import dp, bot
from utils import require_auth
from keyboards import cancel_keyboard
import crud


class AddTask(StatesGroup):
    text = State()


@dp.message_handler(state='*', commands='cancel')
@dp.message_handler(Text(equals='cancel', ignore_case=True), state='*')
async def cancel_handler(message: types.Message, state: FSMContext):
    """
    Allow user to cancel any action
    """
    current_state = await state.get_state()
    if current_state is None:
        return

    # Cancel state and inform user about it
    await state.finish()
    await message.reply('Отменено', reply_markup=types.ReplyKeyboardRemove())


@dp.message_handler(commands=['add_task'])
@require_auth
async def add_task_entry(message: types.Message):
    """Conversation entrypoint"""
    await AddTask.text.set()
    await message.reply("Введите текст задачи:", reply_markup=cancel_keyboard)


@dp.message_handler(state=AddTask.text)
async def process_desc(message: types.Message, state: FSMContext):
    """
    Process task text
    """
    if crud.add_task(text=message.text.strip()):
        await message.reply('Успешно добавлено!', reply_markup=types.ReplyKeyboardRemove())
    else:
        await message.reply('Ошибка при добавлении', reply_markup=types.ReplyKeyboardRemove())
    await state.finish()
