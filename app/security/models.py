import datetime
import re

from pydantic import BaseModel, Field, EmailStr, field_validator,field_serializer
from fastapi import HTTPException, status
from fastapi.responses import ORJSONResponse

from security.config import REFRESH_TOKEN_EXPIRE_DAYS, SECURE, PATH_PREFIX


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


class TokensResponse(ORJSONResponse):
    def __init__(self, access_token: str, refresh_token: str):
        super().__init__({
            "access_token": access_token
        })
        self.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            path=PATH_PREFIX,
            secure=SECURE,
            samesite="lax",
        )


class AccessTokenPayload(BaseModel):
    sub: str | None = None
    scopes: list[str] = []
    exp: datetime.datetime

    @field_validator('scopes', mode='before')
    @classmethod
    def split_scopes(cls, v):
        return v.split(' ') if isinstance(v, str) else v

    @field_serializer('scopes', when_used='json')
    def join_scopes(v):
        return ' '.join(v) if isinstance(v, list) else v


class RefreshTokenPayload(BaseModel):
    sub: str | None   # user's uuid
    exp: datetime.datetime
