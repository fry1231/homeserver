from starlette.responses import Response
from typing import TypeVar

from security.config import DOMAIN, SECURE, PATH_PREFIX, REFRESH_TOKEN_EXPIRE_DAYS


ResponseInstance = TypeVar("ResponseInstance", bound=Response)


def _add_cookies(response: ResponseInstance,
                 refresh_token: str,
                 access_token: str = None) -> ResponseInstance:
    """
    Add access and refresh tokens to response cookies
    :param response: Starlette Response object
    :param access_token: set as cookie for 60 seconds if provided
    :param refresh_token: set as httpOnly cookie for REFRESH_TOKEN_EXPIRE_DAYS days
    :return: modified response object
    """
    cookie_settings = {
        "domain": DOMAIN,
        "secure": True if SECURE else False,
        "samesite": "none",
    }
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        path=PATH_PREFIX,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        **cookie_settings
    )
    response.set_cookie(
        key="use_refresh_token",
        value="true",
        path=PATH_PREFIX,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=False,
        **cookie_settings
    )
    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            path='/set-token',
            max_age=60,
            httponly=False,
            **cookie_settings
        )
    return response
