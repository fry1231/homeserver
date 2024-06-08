import datetime
from strawberry.permission import BasePermission
from strawberry.types import Info
from jose import JWTError, jwt
from uuid import UUID
import typing
from fastapi import HTTPException, status, Depends, Request

from db.sql.models import User
from config import SECRET
from security.config import ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, oauth2_scheme
from security.models import TokensResponse, AccessTokenPayload, RefreshTokenPayload







# async def check_token_expiration(token: str):



# Auth for GraphQL
class StrawberryIsAuthenticated(BasePermission):
    message = "User is not Authenticated"

    async def has_permission(self, source: typing.Any, info: Info, **kwargs) -> bool:
        request = info.context["request"]
        authentication = request.headers["Authorization"]
        if authentication:
            token = authentication.split("Bearer ")[-1]
            return authorize_user(token, check_if_admin=True)
        return False
