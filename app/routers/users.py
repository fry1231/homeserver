from fastapi import Depends, FastAPI, HTTPException, status, APIRouter
from fastapi.responses import RedirectResponse
from ormar.exceptions import NoMatch
import orjson
from config import logger, SECRET
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from db.sql.models import User
from misc.security import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_DAYS,
    Token,
    is_admin
)
from typing import Annotated


router = APIRouter(
    prefix="/users",
    # tags=["items"],
    # dependencies=[Depends(get_token_header)],
    # responses={404: {"description": "Not found"}},
)


class SignupForm(BaseModel):
    username: str
    password: str
    email: str


@router.post("/register")
async def register_user(form_data: SignupForm):
    username = form_data.username
    password = form_data.password
    email = form_data.email
    user = await User.objects.get_or_none(username=username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    n_users = await User.objects.count()
    is_admin = False
    # Make first user admin
    if n_users == 0:
        is_admin = True
    hashed_password = get_password_hash(password)
    user = await User.objects.create(
        username=username,
        hashed_password=hashed_password,
        email=email,
        is_admin=is_admin)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed"
        )
    return RedirectResponse(url="/users/login")


@router.post("/token")
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        user.uuid,
        user.is_admin,
        expire_minutes=(60 * 24 * ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=User)
async def read_users_me(
        current_user: Annotated[User, Depends(is_admin)]
):
    return current_user

