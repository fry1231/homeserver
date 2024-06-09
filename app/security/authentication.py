from passlib.context import CryptContext
from security.utils import get_user_or_none
from db.sql.models import User
from security.models import AuthenticationError401


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def authenticate_user(username: str, password: str) -> User:
    user: User = await get_user_or_none(username=username)
    if user is None or not verify_password(password, user.hashed_password):
        raise AuthenticationError401("Incorrect username or password")
    return user
