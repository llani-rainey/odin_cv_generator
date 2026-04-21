from __future__ import annotations

# routes/auth.py — Google OAuth flow + token endpoints
#
# Replaces the auth views previously in core/urls.py.
#
# Endpoints:
#   GET  /accounts/google/login/            → redirect to Google consent screen
#   GET  /accounts/google/login/callback/   → handle Google redirect, issue tokens
#   POST /api/token/exchange/               → swap one-time Redis code for JWT
#   POST /api/token/refresh/                → silent refresh via httpOnly cookie
#   POST /api/auth/logout/                  → delete refresh_token cookie

import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import (
    FRONTEND_URL,
    build_google_auth_url,
    decode_token,
    exchange_google_code,
    get_google_user_info,
    get_or_create_user,
    redis_client,
    store_tokens_in_redis,
    create_access_token,
)
from database import get_db

router = APIRouter()

_COOKIE = "refresh_token"
_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


# ── Google OAuth ──────────────────────────────────────────────────────────────


@router.get("/accounts/google/login/")
def google_login() -> RedirectResponse:
    """Redirect the browser to Google's OAuth consent screen."""
    return RedirectResponse(build_google_auth_url())


@router.get("/accounts/google/login/callback/")
def google_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Google redirects here after the user approves.

    Flow:
      1. Exchange the Google code for a Google access token (server-to-server via httpx)
      2. Fetch the user's email from Google
      3. Get or create the User in our DB
      4. Generate our own JWT pair and store in Redis under a one-time code (60s)
      5. Redirect to the React frontend with the code in the URL
         → React calls /api/token/exchange/ to swap the code for tokens
    """
    try:
        google_tokens = exchange_google_code(code)
        user_info = get_google_user_info(google_tokens["access_token"])
    except Exception:
        # If Google rejects the code, send the user back to the frontend with an error flag
        return RedirectResponse(f"{FRONTEND_URL}?error=oauth_failed")

    user = get_or_create_user(
        email=user_info["email"], google_id=user_info["id"], db=db
    )
    one_time_code = store_tokens_in_redis(user.id)
    return RedirectResponse(f"{FRONTEND_URL}?code={one_time_code}")


# ── Token endpoints ───────────────────────────────────────────────────────────


class CodeBody(BaseModel):
    code: str


@router.post("/api/token/exchange/")
def exchange_code(body: CodeBody, response: Response) -> dict:
    """
    Exchange a one-time Redis code for JWT tokens.

    Returns the access token in the response body (React stores it in a module-level
    variable — never localStorage, which is XSS-vulnerable).
    Sets the refresh token as an httpOnly cookie (JavaScript cannot read it).

    getdel() is atomic: reads the value and deletes the key in one operation,
    preventing race conditions where two requests could both use the same code.
    """
    token_data = redis_client.getdel(f"code:{body.code}")
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    tokens = json.loads(token_data)

    response.set_cookie(
        key=_COOKIE,
        value=tokens["refresh"],
        httponly=True,  # JavaScript cannot read this cookie — XSS protection
        secure=True,  # HTTPS only
        samesite="none",  # required for cross-origin Vercel → Render requests
        max_age=_COOKIE_MAX_AGE,
    )
    return {"access": tokens["access"]}


@router.post("/api/token/refresh/")
def refresh_token(request: Request) -> dict:
    """
    Silent token refresh — called by React on every page load.

    Reads the httpOnly refresh_token cookie (React cannot access httpOnly cookies
    directly — the browser attaches them automatically on same-origin requests with
    credentials: 'include').

    Returns a fresh access token if the cookie is valid, otherwise 401.
    React treats 401 here as "not logged in" — no error message, just shows the login button.
    """
    refresh = request.cookies.get(_COOKIE)
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")

    # decode_token validates signature + expiry; raises 401 on failure
    user_id = decode_token(refresh)
    return {"access": create_access_token(user_id)}


@router.post("/api/auth/logout/")
def api_logout(response: Response) -> dict:
    """
    Delete the httpOnly refresh_token cookie server-side.
    JavaScript cannot delete httpOnly cookies directly — only the server can.
    Deleting works by sending Set-Cookie with max_age=0 (expires immediately).
    """
    response.delete_cookie(key=_COOKIE, samesite="none")
    return {"detail": "Logged out"}
