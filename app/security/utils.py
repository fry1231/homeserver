import datetime
from typing import Annotated, Union
from pydantic import UUID4
import jwt

from fastapi import HTTPException, status, Depends, Header
from passlib.context import CryptContext

from config import logger
from db.sql.models import User, RefreshToken
from security.models import AccessTokenPayload, RefreshTokenPayload, AuthenticationError401
from security.config import (
    SECRET,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    ALLOW_ONE_SESSION_ONLY
)

UserModel = User
RefreshTokenModel = RefreshToken

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


async def create_user(username: str,
                      hashed_password: str,
                      email: str,
                      scopes: list[str] = None) -> UserModel:
    user = await User.objects.create(username=username,
                                     hashed_password=hashed_password,
                                     email=email,
                                     scope=" ".join(scopes) if scopes else None)
    return user


async def rotate_refresh_token(user: UserModel,
                               refresh_token: str,
                               user_agent: str) -> None:
    """
    Rotate refresh token for user
    If ALLOW_ONE_SESSION_ONLY is True, delete all refresh tokens for this user
    If ALLOW_ONE_SESSION_ONLY is False, delete refresh token only for this user_agent
    :raises HTTPException: if user_agent is None or user not found
    """
    if user_agent is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User-Agent header is required"
        )
    user_with_relations = await UserModel.objects.select_related('refresh_tokens').get_or_none(uuid=user.uuid)
    if user_with_relations is None:
        logger.error(f"User with id {user.uuid} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user_with_relations.refresh_tokens:
        if ALLOW_ONE_SESSION_ONLY:   # If only one session is allowed, delete all refresh tokens
            await RefreshToken.objects.delete(user_id=user.uuid)
        else:                        # If multiple sessions are allowed, delete refresh token for this user_agent
            await RefreshToken.objects.delete(user_id=user.uuid, user_agent=user_agent)
    await RefreshToken.objects.create(token=refresh_token, user_id=user.uuid, user_agent=user_agent)


async def check_refresh_token_validity(token: str):
    """
    Check if refresh token is in refresh_tokens table
    :raises HTTPException: if not
    """
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        payload = RefreshTokenPayload(**payload)
        uuid = payload.sub
        user = await get_user_or_none(uuid=uuid)
        if user is None:
            logger.warning(f"User with uuid {uuid} not found")
            raise AuthenticationError401("User not found")
        if not await RefreshToken.objects.exists(token=token, user_id=user.uuid):
            logger.warning(f"Refresh token {token} not found for user {user.uuid}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
    except jwt.exceptions.ExpiredSignatureError:
        logger.warning(f"Refresh token {token} expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except (jwt.exceptions.InvalidTokenError, jwt.exceptions.DecodeError):
        logger.warning(f"Invalid refresh token {token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


async def get_user_or_none(uuid: UUID4 | str = None,
                           username: str = None,
                           email: str = None) -> User | None:
    """
    Get user by username, email or uuid
    If username is provided, get user by username,
        if no username - get user by email,
        if no email - get user by uuid
    :return: User object or None if user not found
    """
    if uuid:
        user = await User.objects.get_or_none(uuid=uuid)
    elif username:
        user = await User.objects.get_or_none(username=username)
    else:
        user = await User.objects.get_or_none(email=email)
    return user


async def _create_user(username: str,
                       password: str,
                       email: str) -> UserModel:
    user_by_username = await get_user_or_none(username=username)
    user_by_email = await get_user_or_none(email=email)
    # Check if user already exists, raise exception if so
    err_msg = None
    if user_by_username:
        err_msg = "Username already registered"
    elif user_by_email:
        err_msg = "Email already registered"
    if err_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
    # Create user
    hashed_password = get_password_hash(password)
    user = await create_user(username, hashed_password, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed"
        )
    return user


def _create_access_token(sub: str,
                         scopes: str,
                         expire_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    payload = AccessTokenPayload(
        sub=sub,
        scopes=scopes,
        exp=datetime.datetime.utcnow() + datetime.timedelta(minutes=expire_minutes)
    )
    return jwt.encode(payload.model_dump(), key=SECRET, algorithm=ALGORITHM)


def _create_refresh_token(sub: str,
                          expire_days: int = REFRESH_TOKEN_EXPIRE_DAYS):
    payload = RefreshTokenPayload(
        sub=sub,
        exp=datetime.datetime.utcnow() + datetime.timedelta(days=expire_days),
    )
    return jwt.encode(payload.model_dump(), key=SECRET, algorithm=ALGORITHM)


async def _get_tokens(user: UserModel, user_agent: str) -> tuple[str, str]:
    scopes = user.scopes
    access_token = _create_access_token(user.uuid.hex, scopes)
    refresh_token = _create_refresh_token(user.uuid.hex)
    await rotate_refresh_token(user, refresh_token, user_agent)
    return access_token, refresh_token
