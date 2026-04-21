from __future__ import annotations

# auth.py — JWT creation/validation, Google OAuth helpers, Redis client
#
# This module is the security layer. It:
#   1. Defines how JWTs are created and verified (python-jose)
#   2. Provides get_current_user() — a FastAPI dependency that reads the
#      Bearer token from the Authorization header and returns the User
#   3. Wraps the Google OAuth server-to-server calls (httpx)
#   4. Manages the one-time Redis code exchange

import json
import os
import secrets
import urllib.parse
from datetime import datetime, timedelta, timezone

import httpx
import redis as redis_lib
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import User

# ── Config ────────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# Must match the URI registered in Google Cloud Console exactly.
# Local: http://localhost:8000/accounts/google/login/callback/
# Prod:  https://your-app.onrender.com/accounts/google/login/callback/
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/accounts/google/login/callback/",
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"

# Redis client — connects once on module load, reused for every request.
# Stores one-time codes: "code:<uuid>" → JSON token pair, 60s TTL.
redis_client = redis_lib.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))

# ── JWT ───────────────────────────────────────────────────────────────────────

# HTTPBearer reads the "Authorization: Bearer <token>" header.
# When used as a dependency it automatically returns 403 if the header is missing.
security = HTTPBearer()


def create_access_token(user_id: int) -> str:
    """Create a short-lived JWT (15 min). Payload: { sub: str(user_id), exp: ... }"""
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM
    )


def create_refresh_token(user_id: int) -> str:
    """Create a long-lived JWT (7 days) stored in an httpOnly cookie."""
    exp = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM
    )


def decode_token(token: str) -> int:
    """
    Decode and validate a JWT. Returns the user_id (int from the 'sub' claim).
    Raises 401 if the token is invalid, expired, or malformed.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — inject into any route that requires authentication.

    Reads the Bearer token from the Authorization header, validates it,
    and returns the matching User from the database.

    Usage:
        @router.get("/api/cv/")
        def get_cv(current_user: User = Depends(get_current_user)):
            ...
    """
    user_id = decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# ── Google OAuth ──────────────────────────────────────────────────────────────


def build_google_auth_url() -> str:
    """
    Build the URL to redirect the user to Google's OAuth consent screen.
    Google redirects back to GOOGLE_REDIRECT_URI after the user approves.
    """
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile",
        "access_type": "offline",
    }
    return GOOGLE_AUTH_URL + "?" + urllib.parse.urlencode(params)


def exchange_google_code(code: str) -> dict:
    """
    Exchange the Google auth code for an access token server-to-server (httpx).
    The code is single-use and short-lived — this must be called promptly.
    """
    response = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
    )
    response.raise_for_status()
    return response.json()


def get_google_user_info(google_access_token: str) -> dict:
    """Fetch the authenticated user's profile (email, id) from Google."""
    response = httpx.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {google_access_token}"},
    )
    response.raise_for_status()
    return response.json()


def get_or_create_user(email: str, google_id: str, db: Session) -> User:
    """Find an existing user by email, or create a new one. Returns the User."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, google_id=google_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ── Redis one-time code ───────────────────────────────────────────────────────


def store_tokens_in_redis(user_id: int) -> str:
    """
    Generate a JWT pair, store it in Redis under a random one-time code (60s TTL).
    Returns the code. React exchanges this code at /api/token/exchange/.

    The code in the URL is short-lived and single-use, so it's safe to put
    in a redirect URL (unlike the JWT itself, which would be visible in browser history).
    """
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    code = secrets.token_urlsafe(32)
    redis_client.setex(
        f"code:{code}",
        60,  # 60 second TTL
        json.dumps({"access": access_token, "refresh": refresh_token}),
    )
    return code
