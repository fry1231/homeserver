import datetime
from uuid import UUID
import jwt

from fastapi import HTTPException, status, Response
from passlib.context import CryptContext

from db.sql.models import User
from security.models import AccessTokenPayload, RefreshTokenPayload
from security.config import SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from security.config import DOMAIN, PATH_PREFIX, SECURE


UserModel = User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


async def create_user(username: str,
                      hashed_password: str,
                      email: str,
                      scopes: list = None) -> UserModel:
    """
    CRUD operation to create user
    """
    user = await User.objects.create(username=username,
                                     hashed_password=hashed_password,
                                     email=email,
                                     scope=" ".join(scopes) if scopes else None)
    return user


async def get_user_or_none(uuid: UUID = None,
                           username: str = None,
                           email: str = None) -> User | None:
    """
    CRUD operation to get user by username, email or uuid
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
        exp=datetime.datetime.utcnow() + datetime.timedelta(days=expire_days)
    )
    return jwt.encode(payload.model_dump(), key=SECRET, algorithm=ALGORITHM)


def _get_tokens(user: UserModel) -> tuple[str, str]:
    scopes = user.scopes
    access_token = _create_access_token(user.uuid.hex, scopes)
    refresh_token = _create_refresh_token(user.uuid.hex)
    return access_token, refresh_token


def _add_cookies(response: Response,
                 access_token: str,
                 refresh_token: str) -> Response:
    """
    Add access and refresh tokens to response cookies
    :param response: Starlette Response object
    :param access_token: set as cookie for 60 seconds
    :param refresh_token: set as httpOnly cookie for REFRESH_TOKEN_EXPIRE_DAYS days
    :return: modified response object
    """
    cookie_settings = {
        "domain": DOMAIN,
        "path": PATH_PREFIX,
        "secure": True if SECURE else False,
        "samesite": "lax" if SECURE else "none",
    }
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        **cookie_settings
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=60,
        httponly=False,
        **cookie_settings
    )
    return response
