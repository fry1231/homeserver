import datetime

from jose import JWTError, jwt
from uuid import UUID
import typing
from fastapi import HTTPException, status, Depends, Request

from db.sql.models import User
from config import SECRET
from security.config import ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, oauth2_scheme
from security.models import TokensResponse, AccessTokenPayload, RefreshTokenPayload







# async def check_token_expiration(token: str):

