import datetime


def current_time_nanoseconds():
    return int(datetime.datetime.now().timestamp() * 1_000_000_000)


def day_ago_nanoseconds():
    return int((datetime.datetime.now().timestamp() - 3600 * 24) * 1_000_000_000)
