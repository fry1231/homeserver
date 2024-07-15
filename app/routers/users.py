from fastapi import HTTPException, status, APIRouter, Security

from db.sql.models import User
from security import get_authorized_user

router = APIRouter(
    prefix="/users",
)


async def get_user(username: str = None, email: str = None) -> User | None:
    """
    Get user by username or email
    If username provided, email is ignored
    :param username:
    :param email:
    :return: User object or None if user not found
    """
    if username:
        user = await User.objects.get_or_none(username=username)
    else:
        user = await User.objects.get_or_none(email=email)
    return user


async def validate_username(username: str) -> None:
    """
    Check username length and uniqueness

    :raises HTTPException: if username is too short, too long or already registered
    """
    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )
    if len(username) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at most 50 characters long"
        )
    if await get_user(username=username) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )


@router.get("/check-username")
async def check_username(username: str):
    try:
        await validate_username(username)
        return {"valid": True, "message": "Username is valid"}
    except HTTPException as e:
        return {"valid": False, "message": str(e.detail)}


@router.get("/me", response_model=User)
async def read_users_me(user: User = Security(get_authorized_user, scopes=["default"])):
    return user
