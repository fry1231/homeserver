from functools import wraps
from aiogram.utils.exceptions import ChatNotFound
from aiogram.types import Message
from os import getenv
import traceback
from bot import bot
from crud import user_validated


async def notify_me(text):
    try:
        if my_telegram_id := getenv("MY_TELEGRAM_ID") is None:
            print(f'Error while notify_me:\n{traceback.format_exc()}')
        else:
            my_telegram_id = int(my_telegram_id)
            if len(text) > 4096:
                for pos in range(0, len(text), 4096):
                    await bot.send_message(my_telegram_id, text[pos:pos + 4096])
            else:
                await bot.send_message(my_telegram_id, text)
    except ChatNotFound:
        pass


def require_auth(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        message: Message = args[0]
        telegram_id = message.from_user.id
        if user_validated(telegram_id):
            return await func(*args, **kwargs)
        else:
            return message.reply('Access denied')
    return wrapper
