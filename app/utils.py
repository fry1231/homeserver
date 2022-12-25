from calendar_parser import CalendarParser
from pydantic import BaseModel
from pydantic.schema import Optional, List
from datetime import datetime
import pytz


class Event(BaseModel):
    name: str
    description: str
    location: Optional[str]
    day: int
    month: str
    weekday: str
    strtimeslot: str


def get_events() -> List[Event]:
    events = []
    cal = CalendarParser(ics_file='calendar.ics')
    parsed_cal = cal.parse_calendar(force_list=True)
    today = datetime.now().astimezone(pytz.timezone('Europe/Paris'))

    for event in parsed_cal:
        event_dict = {
            'name': event.name,
            'description': event.description,
            'location': event.location
        }
        start_time: datetime = event.start_time
        start_time = start_time.astimezone(pytz.timezone('Europe/Paris'))
        if event.repeats and event.repeat_freq == 'YEARLY':   # YEARLY BYDAY BYMONTHDAY BYMONTH ?UNTIL?
            start_date: datetime = event.start_time
            start_date_this_year = start_date.replace(year=today.year)
            start_date_next = start_date_this_year.replace(year=today.year + 1)

            end_date: datetime = event.end_time
            end_date_this_year = end_date.replace(year=today.year)
            end_date_next = end_date_this_year.replace(year=today.year + 1)

            event_dict['start_time'] = start_date_this_year
            event_dict['end_time'] = end_date_this_year
            events.append(event_dict)

            next_event = event_dict.copy()
            next_event['start_time'] = start_date_next
            next_event['end_time'] = end_date_next
            events.append(next_event)
        else:
            event_dict['start_time'] = event.start_time
            event_dict['end_time'] = event.end_time
            events.append(event_dict)

    # keep only events after today date
    events = [event for event in events if (event['start_time'].replace(tzinfo=None) - today.replace(tzinfo=None)).total_seconds() > 0]
    events.sort(key=lambda event: event['start_time'])

    # Serializing
    event_list = []
    events = events[:5]
    for event in events:
        # if allday or more - display only start_date in strtimeslot
        if (event['end_time'] - event['start_time']).total_seconds() > 86399:
            event['strtimeslot'] = event['start_time'].strftime('All day')
        else:
            event['strtimeslot'] = f'{event["start_time"].strftime("%H:%M")} - {event["end_time"].strftime("%H:%M")}'
        event['weekday'] = event['start_time'].strftime('%A')
        event['day'] = event['start_time'].strftime('%d')
        event['month'] = event['start_time'].strftime('%b')
        event_list.append(Event(**event))
    return event_list
