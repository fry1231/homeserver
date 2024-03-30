from passlib.context import CryptContext
import datetime
import pytz
from config import SECRET, logger
from jose import JWTError, jwt
from fastapi import WebSocket, WebSocketException, status, Query, Depends, Cookie
from db.sql.models import User
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Annotated
from config import SECRET
import orjson
from uuid import UUID


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    uuid: str | None = None
    is_admin: bool = False


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def authenticate_user(username: str, password: str) -> User | bool:
    user = await User.objects.get_or_none(username=username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def user_authorized(token: str, check_if_admin: bool = True) -> bool:
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        user_props = orjson.loads(payload.get("sub"))
        uuid = user_props.get("uuid")
        if uuid is None:
            return False
        user = await User.objects.get_or_none(uuid=uuid)
        if user is None:
            return False
        if check_if_admin and not user.is_admin:
            return False
        return True
    except JWTError:
        return False


def create_access_token(uuid: UUID, is_admin: bool, expire_minutes: int = None):
    payload = {"uuid": uuid.hex, "is_admin": is_admin}
    to_encode = {"sub": orjson.dumps(payload).decode('utf-8')}
    if expire_minutes:
        expire = datetime.datetime.now(pytz.utc) + datetime.timedelta(minutes=expire_minutes)
    else:
        expire = datetime.datetime.now(pytz.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)
    return encoded_jwt


async def is_authorized(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        user_props = orjson.loads(payload.get("sub"))
        uuid = user_props.get("uuid")
        is_admin = user_props.get("is_admin")
        if uuid is None:
            raise credentials_exception
        token_data = TokenData(uuid=uuid, is_admin=is_admin)
    except JWTError:
        raise credentials_exception
    user = await User.objects.get_or_none(uuid=token_data.uuid)
    if user is None:
        raise credentials_exception
    return user


async def is_admin(
        current_user: Annotated[User, Depends(is_authorized)]
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )
    return current_user


async def websocket_authorized(
        websocket: WebSocket,
        session: Annotated[str | None, Cookie()] = None,
        token: Annotated[str | None, Query()] = None,
):
    logger.debug("Websocket authorization")
    if session is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    if token:
        authorized = await user_authorized(token)
        if not authorized:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    logger.debug("Websocket authorized")
    return True
