import aiohttp
import traceback
from typing import Annotated, Optional
import orjson
import jwt
from jose import JWTError

from fastapi import APIRouter, HTTPException, status, Depends, Cookie
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm

from security.utils import create_user, get_user_or_none, _get_tokens, _add_cookies
from security.authentication import authenticate_user
from security.models import TokensResponse, SignupForm, AuthenticationError401, RefreshTokenPayload
from config import logger
from security.config import (
    PATH_PREFIX,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    FRONTEND_URI,
    FRONTEND_REDIRECT_URI,
    SECRET,
    ALGORITHM,
)


router = APIRouter(
    prefix=PATH_PREFIX,
)


@router.post("/signup")
async def register_user(form_data: SignupForm):
    username = form_data.username
    password = form_data.password
    email = form_data.email
    user = await create_user(username, password, email, scopes=['default'])
    access_token, refresh_token = await _get_tokens(user)
    response = RedirectResponse(url=FRONTEND_REDIRECT_URI)
    response = _add_cookies(response, access_token, refresh_token)
    return response


@router.post("/login/form")
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> TokensResponse:
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise AuthenticationError401("Incorrect username or password")
    access_token, refresh_token = await _get_tokens(user)
    response = TokensResponse(access_token, refresh_token)
    return response


@router.get("/login/google")
async def login_google():
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/auth"
                            f"?response_type=code"
                            f"&client_id={GOOGLE_CLIENT_ID}"
                            f"&redirect_uri={GOOGLE_REDIRECT_URI}"
                            f"&scope=openid%20profile%20email"
                            f"&access_type=offline")


@router.get("/google-redirect")
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
            ) as token_response:
                data = await token_response.json()
                g_access_token = data.get("access_token")
                if not g_access_token:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not authenticate with Google"
                    )
                async with session.get(
                        "https://www.googleapis.com/oauth2/v1/userinfo",
                        headers={"Authorization": f"Bearer {g_access_token}"}
                ) as userinfo_response:
                    data = await userinfo_response.json()
                    email = data.get("email")
                    username = data.get("name")
                    password = data.get("id")  # note: every time different

                    user = await get_user_or_none(email=email)
                    if user is None:
                        user = await create_user(username, password, email, scopes=['default'])
                    access_token, refresh_token = await _get_tokens(user)
                    response = RedirectResponse(url=FRONTEND_REDIRECT_URI)
                    response = _add_cookies(response, access_token, refresh_token)
                    return response
    except Exception:
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not authenticate with Google"
        )


@router.get("/refresh")
async def refresh_access_token(
        refresh_token: str = Cookie(None)
):
    if refresh_token is None:
        raise AuthenticationError401("Refresh token not provided")
    try:
        logger.debug(f"Received refresh token: {refresh_token}")
        payload = jwt.decode(refresh_token, SECRET, algorithms=[ALGORITHM])
        payload = RefreshTokenPayload(**payload)
        uuid = payload.sub
        prev_incr = payload.incr
        user = await get_user_or_none(uuid=uuid)
        # Check if user exists
        if user is None:
            raise AuthenticationError401
        # Check if refresh token is valid (increments are equal)
        if prev_incr != user.incr - 1:
            raise AuthenticationError401("Refresh token is not valid")
        access_token, refresh_token = await _get_tokens(user)
        response = TokensResponse(access_token, refresh_token)
        return response
    except jwt.exceptions.ExpiredSignatureError:
        raise AuthenticationError401("Refresh token expired")
    except (JWTError, jwt.exceptions.DecodeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wrong token format"
        )
