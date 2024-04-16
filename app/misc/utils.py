import asyncio


async def delayed_action(delay: int, action: callable, *args, **kwargs):
    """
    Delayed action
    :param delay: delay in seconds
    :param action: action to be performed
    :param args: arguments for the action
    """
    await asyncio.sleep(delay)
    await action(*args, **kwargs)
