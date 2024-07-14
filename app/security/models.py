import datetime
import re

import orjson
from pydantic import BaseModel, Field, EmailStr, field_validator, field_serializer, UUID4
from fastapi import HTTPException, status, Response
from fastapi.responses import ORJSONResponse

from security.config import DOMAIN, REFRESH_TOKEN_EXPIRE_DAYS, PATH_PREFIX, SECURE
from security.cookies import _add_cookies


class AuthenticationError401(HTTPException):
    def __init__(self,
                 detail: str = "Could not validate credentials",
                 authenticate_value: str = "Bearer"):
        """
        401 Unauthorized Error with WWW-Authenticate header

        :param detail: default = "Could not validate credentials"
        :param authenticate_value:
        """
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": authenticate_value},
        )


class AuthorizationError403(HTTPException):
    def __init__(self, detail: str = "Not enough permissions to access this resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class SignupForm(BaseModel):
    model_config = {
        'extra': 'forbid'
    }
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    email: EmailStr

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        assert re.match('^[a-zA-Z0-9]*$', v), 'Username must be alphanumeric'
        return v

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        assert any(c.isupper() for c in v), 'Password must contain at least one uppercase letter'
        assert any(c.islower() for c in v), 'Password must contain at least one lowercase letter'
        assert any(c.isdigit() for c in v), 'Password must contain at least one digit'
        return v


class TokensResponse(Response):
    def __init__(self, refresh_token: str, access_token: str = None):
        super().__init__(
            content=orjson.dumps({'access_token': access_token}),
            media_type='application/json',
            # headers={
            #     'Set-Cookie': f"refresh_token={refresh_token}; "
            #                   f"Path={PATH_PREFIX}; "
            #                   f"Max-Age={REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60}; "
            #                   f"Secure; "
            #                   f"HttpOnly; "
            #                   f"SameSite=None; "
            #                   f"Domain={DOMAIN}",
            # },
        )
        _add_cookies(self, refresh_token)


class AccessTokenPayload(BaseModel):
    sub: str
    scopes: list[str] | str = []
    exp: datetime.datetime

    @field_validator('scopes', mode='before')
    @classmethod
    def split_scopes(cls, v):
        if isinstance(v, list):
            return [str(el) for el in v]
        elif isinstance(v, str):
            return v.split(' ')
        else:
            raise ValueError(f'Invalid scopes type {type(v)}')

    @field_serializer('scopes', when_used='json')
    def join_scopes(v):
        return ' '.join(v) if isinstance(v, list) else v


class RefreshTokenPayload(BaseModel):
    sub: str
    exp: datetime.datetime
