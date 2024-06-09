import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from pydantic import ValidationError
from typing_extensions import Annotated
import typing

from fastapi import Depends, WebSocketException, status, Query, Cookie
from fastapi.security import SecurityScopes
from starlette.websockets import WebSocket
from strawberry.permission import BasePermission
from strawberry.types import Info

from config import SECRET
from security.config import ALGORITHM, oauth2_scheme
from security.models import AuthenticationError401, AuthorizationError403, AccessTokenPayload


def authorize_user(security_scopes: SecurityScopes, token: str = Depends(oauth2_scheme)) -> True:
    """
    Authorize user if:
        - token has required scopes
        - token has 'all' scope
        - no scopes are required
    :param security_scopes:
    :param token:
    :return:
    """
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        token_data = AccessTokenPayload(**payload)
        # Check if token has required scopes
        if not token_data.scopes:
            raise AuthorizationError403("Token has no scopes")
        # If no scopes are required, authorize user
        if not security_scopes.scopes or security_scopes.scopes == []:
            return True
        # Check if user has 'all' scope
        if "all" in token_data.scopes:
            return True
        for scope in security_scopes.scopes:
            if scope not in token_data.scopes:
                raise AuthorizationError403(f"Not enough permissions, {security_scopes.scope_str} required")
    except ExpiredSignatureError:
        raise AuthenticationError401("Token has expired", authenticate_value)
    except (InvalidTokenError, ValidationError):
        raise AuthenticationError401("Could not validate credentials", authenticate_value)
    return True


async def websocket_authorized(
        websocket: WebSocket,
        session: Annotated[str | None, Cookie()] = None,
        token: Annotated[str | None, Query()] = None,
):
    """
    Check if websocket connection is authorized
    :return: True if authorized, else raises WebSocketException
    """
    if session is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    if token:
        authorized = authorize_user(token)
        if not authorized:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return True


class StrawberryIsAuthenticated(BasePermission):
    """
    GraphQL authorization check
    """
    message = "User is not authenticated or has no permissions"

    async def has_permission(self, source: typing.Any, info: Info, **kwargs) -> bool:
        request = info.context["request"]
        authentication = request.headers["Authorization"]
        if authentication:
            token = authentication.split("Bearer ")[-1]
            return self._is_authorized(token, require_scopes=["statistics:read"], master_scope="all")
        return False

    def _is_authorized(self, token: str, require_scopes: list[str], master_scope: str) -> bool:
        try:
            payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
            token_data = AccessTokenPayload(**payload)
            # Check if token has required scopes
            if not token_data.scopes:
                return False
            # If no scopes are required, authorize user
            if not require_scopes or require_scopes == []:
                return True
            # Check if user has master scope
            if master_scope in token_data.scopes:
                return True
            for scope in require_scopes:
                if scope not in token_data.scopes:
                    return False
            return True
        except (ExpiredSignatureError, InvalidTokenError, ValidationError):
            return False
