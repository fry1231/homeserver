from aiogram import types
from os import getenv

from additional_routes import *
from bot import dp, bot
from utils import notify_me
from crud import user_validated, add_trusted_user


@dp.message_handler(commands=['start', 'help'])
async def send_welcome(message: types.Message):
    """
    Greet user, print telegram_id in reply
    """
    user_id = message.from_user.id
    if not (validated := user_validated(user_id)):
        first_name = message.from_user.first_name
        user_name = message.from_user.username
        await notify_me(f'--notification\n'
                        f'Attempted user\n'
                        f'user_id {user_id}\n'
                        f'first_name {first_name}\n'
                        f'user_name {user_name}')
    text = f"""
    Список доступных комманд:
    🔘 /add_task - добавить задачу
    🔘 /delete_task - удалить задачу
    🔘 /delete_task - удалить задачу
    """
    if not validated:
        text += '\nДля продолжения необходимо ввести пароль'
    await message.reply(text)


@dp.message_handler()
async def handle_other(message: types.Message):
    """
    Handle messages depending on its context
    """
    if message.text == '122222322':
        add_trusted_user(message.from_user.id)
        await message.reply('Пользователь добавлен в доверенные')
    if message.from_user.id == getenv("MY_TELEGRAM_ID"):
        if message.reply_to_message is not None:
            message_with_credentials: types.Message = message.reply_to_message
            splitted = message_with_credentials.text.split('\n')
            user_id_row = [el for el in splitted if el.startswith('user_id=')][-1]
            user_id = int(user_id_row.replace('user_id=', ''))

            message_id_row = [el for el in splitted if el.startswith('message_id=')][-1]
            reply_message_id = int(message_id_row.replace('message_id=', ''))

            text_to_reply = message.text

            await bot.send_message(chat_id=user_id,
                                   text=text_to_reply,
                                   reply_to_message_id=reply_message_id)
            await notify_me('Message sent')
    else:
        await notify_me(f'User {message.from_user.username} / {message.from_user.first_name} '
                        f'writes:\n'
                        f'{message.text}\n\n'
                        f'user_id={message.from_user.id}\n'
                        f'message_id={message.message_id}')
        await message.reply("Доступ запрещён, введите пароль:")
