from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from db.sql.models import User
from security.security import (
    authenticate_user,
    create_access_token
)
from security.authorization import get_password_hash
from security.models import TokensResponse
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, DOMAIN, logger
from typing import Annotated
import aiohttp
import traceback


router = APIRouter(
    prefix="/users",
)


async def get_user(username: str = None, email: str = None) -> User:
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
    if get_user(username=username):
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
async def read_users_me(
        current_user: Annotated[User, Depends(is_admin)]
):
    return current_user

