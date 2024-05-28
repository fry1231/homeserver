from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from db.sql.models import User
from misc.security import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_DAYS,
    Token
)
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, DOMAIN, logger
from misc.dependencies import is_admin
from typing import Annotated
import aiohttp
import traceback


router = APIRouter(
    prefix="/users",
)


class SignupForm(BaseModel):
    username: str
    password: str
    email: str


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


async def create_user(username: str,
                      password: str,
                      email: str) -> User:
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
    return user


@router.get("/check-username")
async def check_username(username: str):
    try:
        await validate_username(username)
        return {"valid": True, "message": "Username is valid"}
    except HTTPException as e:
        return {"valid": False, "message": str(e.detail)}


@router.post("/signup")
async def register_user(form_data: SignupForm):
    username = form_data.username
    password = form_data.password
    email = form_data.email
    await create_user(username, password, email)
    return RedirectResponse(url="/users/login")


@router.post("/login/form")
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


@router.get("/login/google")
async def login_google():
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/auth"
                            f"?response_type=code"
                            f"&client_id={GOOGLE_CLIENT_ID}"
                            f"&redirect_uri={GOOGLE_REDIRECT_URI}"
                            f"&scope=openid%20profile%20email"
                            f"&access_type=offline")


@router.get("/auth/google")
async def google_login(code: str):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "redirect_uri": GOOGLE_REDIRECT_URI,
                        "grant_type": "authorization_code",
                    }
            ) as response:
                data = await response.json()
                access_token = data.get("access_token")
                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not authenticate with Google"
                    )
                async with session.get(
                        "https://www.googleapis.com/oauth2/v1/userinfo",
                        headers={"Authorization": f"Bearer {access_token}"}
                ) as response:
                    data = await response.json()
                    email = data.get("email")
                    username = data.get("name")
                    password = data.get("id")   # every time different

                    user = await get_user(email=email)
                    if user is None:
                        user = await create_user(username, password, email)
                    jwt_token = create_access_token(
                        user.uuid,
                        user.is_admin,
                        expire_minutes=(60 * 24 * ACCESS_TOKEN_EXPIRE_DAYS)
                    )
                    return HTMLResponse(f"""
                    <html>
                    <script>
                        localStorage.setItem("token", "{jwt_token}");
                        setTimeout(function(){{ window.location.href =`https://hs.{DOMAIN}`; }}, 1000);
                    </script>
                    <body>
                        <h5>Logging in...</h5>
                    </body>
                    </html>
                    """, status_code=200)
    except Exception as e:
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not authenticate with Google"
        )


@router.get("/me", response_model=User)
async def read_users_me(
        current_user: Annotated[User, Depends(is_admin)]
):
    return current_user

