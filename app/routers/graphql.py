import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
import datetime
from typing import List, Union, ForwardRef

from misc.security import IsAuthenticated
from db.sql.models import (
    OrmarMigraineUser,
    OrmarDrugUse,
    OrmarPainCase,
    OrmarPressure,
    OrmarStatistics
)


BigInt = strawberry.scalar(
    Union[int, str],  # type: ignore
    serialize=lambda v: int(v),
    parse_value=lambda v: str(v),
    description="BigInt field",
)


# For determining the start and end times for the current day between daily reports
def get_start_end_datetimes():
    now = datetime.datetime.now()
    if now.time() < datetime.time(21, 30):
        start = datetime.datetime(now.year, now.month, now.day, 21, 30) - datetime.timedelta(days=1)
        end = datetime.datetime(now.year, now.month, now.day, 21, 30)
    else:
        start = datetime.datetime(now.year, now.month, now.day, 21, 30)
        end = datetime.datetime(now.year, now.month, now.day, 21, 30) + datetime.timedelta(days=1)
    return start, end


async def get_user_druguses(root, info: Info) -> List["DrugUse"] | int:
    """Get all druguses for a user OR a count of druguses if the field is n_druguses."""
    if 'n_' in info.python_name:
        n_druguses = await OrmarDrugUse.objects.filter(owner_id=root.telegram_id).count()
        return n_druguses
    druguses = await OrmarDrugUse.objects.filter(owner_id=root.telegram_id).all()
    return [DrugUse.from_orm(druguse) for druguse in druguses]


async def get_paincase_druguses(root) -> List["DrugUse"]:
    druguses = await OrmarDrugUse.objects.filter(paincase_id=root.id).all()
    return [DrugUse.from_orm(druguse) for druguse in druguses]


async def get_user_paincases(root, info: Info) -> List["PainCase"]:
    """Get all paincases for a user OR a count of paincases if the field is n_paincases."""
    if 'n_' in info.python_name:
        n_paincases = await OrmarPainCase.objects.filter(owner_id=root.telegram_id).count()
        return n_paincases
    paincases = await OrmarPainCase.objects.filter(owner_id=root.telegram_id).all()
    return [PainCase.from_orm(paincase) for paincase in paincases]


async def get_user_pressures(root, info: Info) -> List["Pressure"]:
    """Get all pressures for a user OR a count of pressures if the field is n_pressures."""
    if 'n_' in info.python_name:
        n_pressures = await OrmarPressure.objects.filter(owner_id=root.telegram_id).count()
        return n_pressures
    pressures = await OrmarPressure.objects.filter(owner_id=root.telegram_id).all()
    return [Pressure.from_orm(pressure) for pressure in pressures]


@strawberry.type
class DrugUse:
    id: int
    date: datetime.date
    amount: str
    drugname: str
    owner_id: int
    paincase_id: int | None

    @classmethod
    def from_orm(cls, orm_drug):
        return cls(
            id=orm_drug.id,
            date=orm_drug.date,
            amount=orm_drug.amount,
            drugname=orm_drug.drugname,
            owner_id=orm_drug.owner_id,
            paincase_id=orm_drug.paincase_id
        )


@strawberry.type
class PainCase:
    id: int
    date: datetime.date
    durability: int
    intensity: int
    aura: bool
    provocateurs: str | None
    symptoms: str | None
    description: str | None
    owner_id: "User"
    medecine_taken: List[DrugUse] | None = strawberry.field(resolver=get_paincase_druguses)

    @classmethod
    def from_orm(cls, orm_pain):
        return cls(
            id=orm_pain.id,
            date=orm_pain.date,
            durability=orm_pain.durability,
            intensity=orm_pain.intensity,
            aura=orm_pain.aura,
            provocateurs=orm_pain.provocateurs,
            symptoms=orm_pain.symptoms,
            description=orm_pain.description,
            owner_id=orm_pain.owner_id
        )


@strawberry.type
class Pressure:
    id: int
    datetime: datetime.datetime
    systolic: int
    diastolic: int
    pulse: int
    owner_id: int

    @classmethod
    def from_orm(cls, orm_pressure):
        return cls(
            id=orm_pressure.id,
            datetime=orm_pressure.datetime,
            systolic=orm_pressure.systolic,
            diastolic=orm_pressure.diastolic,
            pulse=orm_pressure.pulse,
            owner_id=orm_pressure.owner_id
        )


@strawberry.type
class User:
    telegram_id: BigInt
    last_notified: datetime.datetime
    notify_every: int
    first_name: str | None
    last_name: str | None
    user_name: str | None
    joined: datetime.date
    timezone: str
    language: str
    utc_notify_at: datetime.time
    latitude: float | None
    longitude: float | None

    n_paincases: int = strawberry.field(resolver=get_user_paincases)
    n_druguses: int = strawberry.field(resolver=get_user_druguses)
    n_pressures: int = strawberry.field(resolver=get_user_pressures)

    paincases: List[PainCase] | None = strawberry.field(resolver=get_user_paincases)
    druguses: List[DrugUse] | None = strawberry.field(resolver=get_user_druguses)
    pressures: List[Pressure] | None = strawberry.field(resolver=get_user_pressures)

    @classmethod
    def from_orm(cls, instance: OrmarMigraineUser):
        return cls(
            telegram_id=instance.telegram_id,
            last_notified=instance.last_notified,
            notify_every=instance.notify_every,
            first_name=instance.first_name,
            last_name=instance.last_name,
            user_name=instance.user_name,
            joined=instance.joined,
            timezone=instance.timezone,
            language=instance.language,
            utc_notify_at=instance.utc_notify_at,
            latitude=instance.latitude,
            longitude=instance.longitude
        )


@strawberry.type
class Statistics:
    id: int
    date: datetime.date
    new_users: int
    deleted_users: int
    active_users: int
    super_active_users: int
    paincases: int
    druguses: int
    pressures: int
    medications: int

    @classmethod
    def from_orm(cls, orm_stat):
        return cls(
            id=orm_stat.id,
            date=orm_stat.date,
            new_users=orm_stat.new_users,
            deleted_users=orm_stat.deleted_users,
            active_users=orm_stat.active_users,
            super_active_users=orm_stat.super_active_users,
            paincases=orm_stat.paincases,
            druguses=orm_stat.druguses,
            pressures=orm_stat.pressures,
            medications=orm_stat.medications
        )


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def user(self, telegram_id: int) -> User:
        user = await OrmarMigraineUser.objects.get(telegram_id=telegram_id)
        return User.from_orm(user)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def users(self,
                    telegram_ids: List[int] | None = None,
                    has_coordinates: bool | None = None,
                    language: str | None = None,
                    timezone: str | None = None
                    ) -> List[User]:
        query_set = []
        if telegram_ids:
            query_set.append(OrmarMigraineUser.telegram_id.in_(telegram_ids))
        if has_coordinates is not None:
            query_set.append(OrmarMigraineUser.latitude.isnull(not has_coordinates))
        if language:
            query_set.append(OrmarMigraineUser.language == language)
        if timezone:
            query_set.append(OrmarMigraineUser.timezone == timezone)
        users = await OrmarMigraineUser.objects.filter(*query_set).all()
        return [User.from_orm(user) for user in users]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def statistics(self, after_date: datetime.date, before_date: datetime.date) -> List[Statistics]:
        statistics = await OrmarStatistics.objects.filter(
            date__gte=after_date,
            date__lte=before_date
        ).all()
        return [Statistics.from_orm(stat) for stat in statistics]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def todays_paincases(self) -> list[PainCase]:
        paincases = await OrmarPainCase.objects.filter(date=datetime.date.today()).all()
        return [PainCase.from_orm(paincase) for paincase in paincases]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def todays_druguses(self) -> list[DrugUse]:
        druguses = await OrmarDrugUse.objects.filter(date=datetime.date.today()).all()
        return [DrugUse.from_orm(druguse) for druguse in druguses]


schema = strawberry.Schema(Query)

graphql_app = GraphQLRouter(schema)
