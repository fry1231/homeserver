import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
import datetime
from typing import List, Union, ForwardRef, NewType

from misc.security import IsAuthenticated
from db.sql.models import (
    OrmarMigraineUser,
    OrmarSavedUser,
    OrmarDrugUse,
    OrmarPainCase,
    OrmarPressure,
    OrmarStatistics
)


BigInt = strawberry.scalar(
    # Union[int, str],
    NewType("BigInt", Union[int, str]),
    serialize=lambda v: str(v),
    parse_value=lambda v: int(v),
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


async def get_owner(root, info: Info) -> "User":
    """Get the owner of a paincase, druguse or pressure."""
    owner = await OrmarMigraineUser.objects.get(telegram_id=root.owner_id)
    return User.from_orm(owner)


@strawberry.type
class DrugUse:
    id: int
    date: datetime.date
    amount: str
    drugname: str
    owner_id: BigInt
    owner: "User" = strawberry.field(resolver=get_owner)
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
    owner_id: BigInt
    owner: "User" = strawberry.field(resolver=get_owner)
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
    owner_id: BigInt
    owner: "User" = strawberry.field(resolver=get_owner)

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
    joined: datetime.date | None    # None for old users
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
    after_date: datetime.date
    before_date: datetime.date
    n_new_users: int
    n_deleted_users: int
    n_active_users: int
    n_super_active_users: int
    n_paincases: int
    n_druguses: int
    n_pressures: int

    new_users: List[User]
    deleted_users: List[User]
    super_active_users: List[User]
    paincases: List[PainCase]
    druguses: List[DrugUse]
    pressures: List[Pressure]


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def user(self, telegram_id: BigInt) -> User:
        user = await OrmarMigraineUser.objects.get(telegram_id=telegram_id)
        return User.from_orm(user)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def users(self,
                    telegram_ids: List[BigInt] | None = None,
                    has_coordinates: bool | None = None,
                    language: str | None = None,
                    timezone: str | None = None,
                    active: bool | None = None,
                    super_active: bool | None = None,
                    active_after: datetime.date | None = None,
                    active_before: datetime.date | None = None
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
        if active is not None:
            # Has at least 1 submitted paincase, druguse or pressure in all time or notify every != -1
            paincase_users = await OrmarPainCase.objects.fields(['owner_id']).all()
            druguse_users = await OrmarDrugUse.objects.fields(['owner_id']).all()
            pressure_users = await OrmarPressure.objects.fields(['owner_id']).all()
            active_users_id = set([el.owner_id for el in paincase_users] +
                                  [el.owner_id for el in druguse_users] +
                                  [el.owner_id for el in pressure_users])
            query_set.append(OrmarMigraineUser.id.in_(active_users_id))
        if super_active is not None:
            # Has at least 1 submitted paincase, druguse or pressure in the last month or notify every != -1
            before_datetime = datetime.datetime.now()
            after_datetime = before_datetime - datetime.timedelta(days=30)
            if active_after:
                after_datetime = active_after
            if active_before:
                before_datetime = active_before

            paincase_users = await OrmarPainCase.objects.filter(date__gte=after_datetime,
                                                                date__lte=before_datetime).values('owner_id').all()
            druguse_users = await OrmarDrugUse.objects.filter(date__gte=after_datetime,
                                                              date__lte=before_datetime).values('owner_id').all()
            pressure_users = await OrmarPressure.objects.filter(datetime__gte=after_datetime,
                                                                datetime__lte=before_datetime).values('owner_id').all()
            super_active_users_id = set([el.owner_id for el in paincase_users] +
                                        [el.owner_id for el in druguse_users] +
                                        [el.owner_id for el in pressure_users])
            query_set.append(OrmarMigraineUser.id.in_(super_active_users_id))
        if len(query_set) == 0:
            return []
        users = await OrmarMigraineUser.objects.filter(*query_set).all()
        return [User.from_orm(user) for user in users]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def paincases(self, ids: list[int] | None = None,
                        after_date: datetime.date | None = None,
                        before_date: datetime.date | None = None) -> list[PainCase]:
        query_set = []
        if ids:
            query_set.append(OrmarPainCase.id.in_(ids))
        if after_date:
            query_set.append(OrmarPainCase.date >= after_date)
        if before_date:
            query_set.append(OrmarPainCase.date <= before_date)
        if len(query_set) == 0:
            return []
        paincases = await OrmarPainCase.objects.filter(*query_set).all()
        return [PainCase.from_orm(paincase) for paincase in paincases]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def druguses(self, ids: list[int] | None = None,
                       after_date: datetime.date | None = None,
                       before_date: datetime.date | None = None) -> list[DrugUse]:
        query_set = []
        if ids:
            query_set.append(OrmarDrugUse.id.in_(ids))
        if after_date:
            query_set.append(OrmarDrugUse.date >= after_date)
        if before_date:
            query_set.append(OrmarDrugUse.date <= before_date)
        if len(query_set) == 0:
            return []
        druguses = await OrmarDrugUse.objects.filter(*query_set).all()
        return [DrugUse.from_orm(druguse) for druguse in druguses]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def pressures(self, ids: list[int] | None = None,
                        after_date: datetime.date | None = None,
                        before_date: datetime.date | None = None) -> list[Pressure]:
        query_set = []
        if ids:
            query_set.append(OrmarPressure.id.in_(ids))
        if after_date:
            query_set.append(OrmarPressure.datetime >= after_date)
        if before_date:
            query_set.append(OrmarPressure.datetime <= before_date)
        if len(query_set) == 0:
            return []
        pressures = await OrmarPressure.objects.filter(*query_set).all()
        return [Pressure.from_orm(pressure) for pressure in pressures]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def statistics(self,
                         after_date: datetime.date,
                         before_date: datetime.date,
                         only_summarized: bool = True) -> Statistics:
        statistics = await OrmarStatistics.objects.filter(
            date__gte=after_date, date__lte=before_date
        ).sum(["new_users", "deleted_users", "active_users", "super_active_users", "paincases", "druguses", "pressures"])
        new_users = deleted_users = super_active_users = paincases = druguses = pressures = []
        if not only_summarized:
            paincases: list[OrmarPainCase] = await OrmarPainCase.objects.filter(date__gte=after_date, date__lte=before_date).all()
            druguses = await OrmarDrugUse.objects.filter(date__gte=after_date, date__lte=before_date).all()
            pressures = await OrmarPressure.objects.filter(datetime__gte=after_date, datetime__lte=before_date).all()

            new_users = await OrmarMigraineUser.objects.filter(joined__gte=after_date, joined__lte=before_date).all()
            deleted_users = await OrmarSavedUser.objects.filter(deleted__gte=after_date, deleted__lte=before_date).all()
            active_users_id = [el.owner_id for el in paincases] + \
                              [el.owner_id for el in druguses] + \
                              [el.owner_id for el in pressures]
            super_active_users = await OrmarMigraineUser.objects.filter(id__in=active_users_id).all()
            paincases: list[PainCase] = [PainCase.from_orm(paincase) for paincase in paincases]
            druguses = [DrugUse.from_orm(druguse) for druguse in druguses]
            pressures = [Pressure.from_orm(pressure) for pressure in pressures]
        return Statistics(
            after_date=after_date,
            before_date=before_date,
            n_new_users=statistics.new_users,
            n_deleted_users=statistics.deleted_users,
            n_active_users=statistics.active_users,
            n_super_active_users=statistics.super_active_users,
            n_paincases=statistics.paincases,
            n_druguses=statistics.druguses,
            n_pressures=statistics.pressures,
            new_users=new_users,
            deleted_users=deleted_users,
            super_active_users=super_active_users,
            paincases=paincases,
            druguses=druguses,
            pressures=pressures
        )


schema = strawberry.Schema(Query)

graphql_app = GraphQLRouter(schema)
