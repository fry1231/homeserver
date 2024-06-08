from passlib.context import CryptContext
from app.security.utils import get_user
from db.sql.models import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def authenticate_user(username: str, password: str) -> User | bool:
    user: User = await get_user(username=username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
