from ormar import Integer, BigInteger, SmallInteger, String, Date, Time, DateTime, Boolean, Float
from db.sql import (
    database, migraine_database,
    engine, migraine_engine
)
import datetime
from uuid import uuid4

import ormar
from sqlalchemy import MetaData
import ormar_postgres_extensions as ormar_pg_ext
from typing import ForwardRef, Optional


# ======================  Dashboard Models  ====================== #
base_config = ormar.OrmarConfig(
    metadata=MetaData(),
    database=database,
    engine=engine
)


class Task(ormar.Model):
    ormar_config = base_config.copy(tablename='tasks')

    id = Integer(primary_key=True)
    text = String(nullable=False, max_length=256)
    finished = Boolean(default=False)


class User(ormar.Model):
    ormar_config = base_config.copy(tablename='users')

    uuid = ormar_pg_ext.UUID(primary_key=True, default=lambda: uuid4().hex)
    username = String(max_length=256, nullable=False)
    hashed_password = String(max_length=256)
    email = String(max_length=256, nullable=False)
    is_admin = Boolean(default=False)


# ======================  Migraine Models  ====================== #
base_migraine_config = ormar.OrmarConfig(
    metadata=MetaData(),
    database=migraine_database,
    engine=migraine_engine
)


class OrmarMigraineUser(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='users')

    telegram_id = BigInteger(primary_key=True, index=True)
    last_notified = DateTime(default=datetime.datetime.min)
    notify_every = SmallInteger(default=-1)
    first_name = String(max_length=256, nullable=True)
    last_name = String(max_length=256, nullable=True)
    user_name = String(max_length=256, nullable=True)
    joined = Date(nullable=True)
    timezone = String(default='Europe/Moscow', max_length=256)
    language = String(max_length=2, default='ru')
    utc_notify_at = Time(default=datetime.time(18, 0))
    latitude = Float(nullable=True)
    longitude = Float(nullable=True)

    # paincases = ormar.ForeignKey(ForwardRef('OrmarPainCase'), virtual=True)
    # druguses = ormar.ForeignKey(ForwardRef('OrmarDrugUse'), virtual=True)
    # pressures = ormar.ForeignKey(ForwardRef('OrmarPressure'), virtual=True)


class OrmarPainCase(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='pains')

    id = Integer(primary_key=True, index=True)
    date = Date()
    durability = SmallInteger()
    intensity = SmallInteger()
    aura = Boolean()
    provocateurs = String(max_length=512, nullable=True)
    symptoms = String(max_length=512, nullable=True)
    description = String(max_length=1024, nullable=True)

    owner_id = ormar.ForeignKey(OrmarMigraineUser, related_name='paincases')
    # medecine_taken = ormar.ForeignKey(ForwardRef('OrmarDrugUse'), virtual=True)


class OrmarDrugUse(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='druguses')

    id = Integer(primary_key=True, index=True)
    date = Date()
    amount = String(max_length=256)
    drugname = String(max_length=256)

    owner_id = ormar.ForeignKey(OrmarMigraineUser, related_name='druguses')
    paincase_id = ormar.ForeignKey(OrmarPainCase, related_name='medecine_taken')


class OrmarPressure(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='pressures')

    id = Integer(primary_key=True, index=True)
    datetime = DateTime()
    systolic = SmallInteger()
    diastolic = SmallInteger()
    pulse = SmallInteger()

    owner_id = ormar.ForeignKey(OrmarMigraineUser, related_name='pressures')


class OrmarStatistics(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='statistics')

    id = Integer(primary_key=True, index=True)
    date = Date()
    new_users = SmallInteger()
    deleted_users = SmallInteger()
    active_users = SmallInteger()
    super_active_users = SmallInteger()
    paincases = Integer()
    druguses = Integer()
    pressures = Integer()
    medications = Integer()


class OrmarSavedUser(ormar.Model):
    ormar_config = base_migraine_config.copy(tablename='saved_users')

    id = Integer(primary_key=True, index=True)
    telegram_id = BigInteger()
    first_name = String(max_length=256)
    last_name = String(max_length=256)
    user_name = String(max_length=256)
    joined = Date()
    deleted = Date()
    timezone = String(max_length=256)
    language = String(max_length=2)
    latitude = Float()
    longitude = Float()


OrmarMigraineUser.update_forward_refs()
OrmarPainCase.update_forward_refs()

ormar_metadata = base_config.metadata
