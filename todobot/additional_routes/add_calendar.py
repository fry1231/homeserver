from aiogram import types
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from bot import dp, bot
import crud
from utils import require_auth
import io
from keyboards import generate_del_tasks_kb


@dp.message_handler(commands=['add_calendar'])
@require_auth
async def add_calendar(message: types.Message):
    await message.reply("Присылай:")


@dp.message_handler(content_types=['document'])
@require_auth
async def process_cal(message: types.Message):
    user_id = message.from_user.id
    buf = io.BytesIO()
    if message.document.file_name[-4:] != '.ics':
        await message.reply('Расширение файла должно быть .ics')
    else:
        await message.document.download(destination_file=buf)
        if crud.add_calendar(buf, f'calendar_{user_id}.ics'):
            await message.reply('Успешно загружено!')
        else:
            await message.reply('Ошибка при загрузке')
