# import pytest
# from fastapi.testclient import TestClient
# from fastapi.security import SecurityScopes
# from unittest.mock import patch
# import pytest_asyncio
# from time import time
#
# from security.authentication import authenticate_user
# from security.authorization import authorize_user
# from security.models import AuthenticationError401, AuthorizationError403
# from security.utils import get_password_hash, UserModel
#
#
# @pytest.mark.asyncio
# async def test_authenticate_user():
#     test_user = UserModel(username="test", hashed_password=get_password_hash("test123"), email="test@test.com")
#
#     # Test with correct username and password
#     assert await authenticate_user("test", "test123") == test_user
#
#     # Test with incorrect username
#     with pytest.raises(AuthenticationError401):
#         await authenticate_user("wrong", "test123")
#
#     # Test with incorrect password
#     with pytest.raises(AuthenticationError401):
#         await authenticate_user("test", "wrong")
#
#
# @pytest.mark.asyncio
# async def test_authorize_user():
#     test_token = "test_token"
#     patch("jwt.decode", return_value={"sub": "test",
#                                       "exp": int(time() + 60),
#                                       "scopes": ["read", "write"]})
#
#     # Test with correct scopes
#     assert authorize_user(SecurityScopes(["read", "write"]), test_token)
#
#     # Test with incorrect scopes
#     with pytest.raises(AuthorizationError403):
#         await authorize_user(SecurityScopes(["read", "delete"]), test_token)
