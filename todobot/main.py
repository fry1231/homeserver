import logging
from aiogram import executor
from aiogram.utils.exceptions import ChatNotFound
import asyncio
from routes import *
import traceback


# Configure logging
logging.basicConfig(level=logging.INFO)


async def on_startup(_):
    await notify_me('Bot restarted')
    await bot.set_my_commands([
        types.bot_command.BotCommand('add_task', 'новая задача'),
        types.bot_command.BotCommand('delete_task', 'удалить задачу'),
        types.bot_command.BotCommand('add_calendar', 'добавить календарь'),
    ])


if __name__ == '__main__':
    try:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        )
        executor.start_polling(dp, skip_updates=True, on_startup=on_startup)
    except:
        asyncio.run(notify_me(traceback.format_exc()))
