from fastapi.security import OAuth2PasswordBearer
import os


IS_TESTING = bool(os.getenv('IS_TESTING', default='1'))
SECURE = True
PATH_PREFIX = "/auth"
ALGORITHM = "HS256"
SECRET = os.getenv("SECRET", default='secret')
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

DOMAIN = 'localhost' if IS_TESTING else os.getenv('DOMAIN')
BACKEND_SUBDOMAIN = 'homescreen'
FRONTEND_SUBDOMAIN = 'hs'
FRONTEND_URI = f"https://{FRONTEND_SUBDOMAIN}.{DOMAIN}"
LOGIN_URI = f"{FRONTEND_URI}/login"   # To redirect to when refresh token is expired

SCOPES_DESCRIPTION = {
    'default': 'Default access for new users',
    'all': 'Full access to all resources',
    'sensors:write': 'Write sensor data, ask for irrigation',
    'sensors:read': 'Read sensor data',
    'statistics:read': 'Read statistics',
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{PATH_PREFIX}/login/form", scopes=SCOPES_DESCRIPTION)

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = f"https://{BACKEND_SUBDOMAIN}.{DOMAIN}{PATH_PREFIX}/google-redirect"
FRONTEND_REDIRECT_URI = f"{FRONTEND_URI}/set-token"   # Here frontend will set the token in local storage
