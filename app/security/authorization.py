from jose import jwt, JWTError
import datetime
from pydantic import ValidationError, BaseModel

from fastapi import Depends, Request, Security, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

from config import SECRET
from security.config import ALGORITHM, oauth2_scheme, PATH_PREFIX
from security.models import AuthenticationError401, AuthorizationError403


def authorize_user(security_scopes: SecurityScopes, token: str = Depends(oauth2_scheme)):
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        uuid = payload.get("sub")
        scopes = payload.get("scopes").split(" ")
        exp = payload.get("exp")
        # Check if token is expired
        if exp is None:
            raise AuthenticationError401("Token has no expiration date", authenticate_value)
        else:
            if datetime.datetime.utcfromtimestamp(exp) < datetime.datetime.utcnow():
                # If refresh token is valid, renew the access token
                if refresh_token and jwt.decode(refresh_token, SECRET, algorithms=[ALGORITHM]):
                    new_token = create_access_token(uuid, is_admin)
                    response = RedirectResponse(url=request.url.path)
                    response.set_cookie(key="token", value=new_token, httponly=True, secure=True)
                    return response
                else:
                    # If refresh token is not valid, redirect to login
                    return RedirectResponse(url="/users/login")
    except JWTError:
        raise AuthenticationError401
    return token_data


async def is_admin(request: Request, token: str = Depends(oauth2_scheme), refresh_token: str = Cookie(None)):
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM], options={"verify_exp": False})
        uuid = payload.get("sub")
        is_admin = payload.get("is_admin")
        exp = payload.get("exp")
        # Check if token is expired
        if exp is not None:
            if datetime.datetime.utcfromtimestamp(exp) < datetime.datetime.utcnow():
                # If refresh token is valid, renew the access token
                if refresh_token and jwt.decode(refresh_token, SECRET, algorithms=[ALGORITHM]):
                    new_token = create_access_token(uuid, is_admin)
                    response = RedirectResponse(url=request.url.path)
                    response.set_cookie(key="token", value=new_token, httponly=True, secure=True)
                    return response
                else:
                    # If refresh token is not valid, redirect to login
                    return RedirectResponse(url="/users/login")
        if uuid is None:
            raise AuthenticationError401
        if not is_admin:
            raise AuthorizationError403
        token_data = TokenData(uuid=uuid, is_admin=is_admin)
    except JWTError:
        raise AuthenticationError401
    return user
