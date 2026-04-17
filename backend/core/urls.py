from __future__ import annotations

import json
import os
import secrets

import redis
from django.contrib import admin
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# Connect to Redis on module load — runs once when Django starts.
# Falls back to localhost for local development.
redis_client = redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))


def logout_view(request: HttpRequest) -> HttpResponseRedirect:
    """
    Browser-based logout for allauth flows.
    Deletes the refresh_token cookie and clears the Django session,
    then redirects to the frontend.
    """
    response = redirect("https://odin-cv-generator-iota.vercel.app")
    response.delete_cookie("refresh_token", samesite="None")
    logout(request)
    return response


@login_required
def google_login_success(request: HttpRequest) -> HttpResponseRedirect:
    """
    Called after Google OAuth completes (LOGIN_REDIRECT_URL points here).
    Generates a JWT token pair, stores it in Redis under a one-time code
    (60-second TTL), and redirects React with just the code in the URL.
    The code is exchanged for tokens by the frontend via /api/token/exchange/.
    """
    code = secrets.token_urlsafe(32)
    # secrets — cryptographically secure random string generator
    # token_urlsafe(32) — 32 bytes of random data, base64 encoded → ~43 char string
    # code goes in the URL so it must be unguessable

    refresh = RefreshToken.for_user(request.user)
    # RefreshToken.for_user() — generates a JWT token pair for the given User
    # str(refresh) → refresh token string
    # str(refresh.access_token) → access token string

    tokens = {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

    # Store tokens in Redis against the one-time code for 60 seconds.
    # Redis auto-deletes the key after the TTL — code expires even if React never exchanges it.
    redis_client.setex(
        f"code:{code}",
        60,
        json.dumps(tokens),
    )

    # Redirect with just the code — never the token itself.
    # Token in URL = visible in browser history, logs, referrer headers (bad).
    # Code in URL = safe, short-lived (60s), one-time use, useless without exchange.
    return redirect(f"https://odin-cv-generator-iota.vercel.app?code={code}")


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def exchange_code(request: Request) -> Response:
    """
    Exchange a one-time Redis code for a JWT access token.
    Returns the access token in the response body and sets the refresh token
    as an httpOnly cookie (inaccessible to JavaScript — XSS protection).
    The code is atomically deleted from Redis on use (one-time only).
    """
    code = request.data.get("code")
    if not code:
        return Response({"error": "No code provided"}, status=400)

    # getdel() — atomic get-and-delete: prevents code reuse even in race conditions.
    # Returns None if key doesn't exist or has already expired.
    token_data = redis_client.getdel(f"code:{code}")

    if not token_data:
        return Response({"error": "Invalid or expired code"}, status=400)

    tokens = json.loads(token_data)

    response = Response({"access": tokens["access"]})
    # Access token in body — React stores in memory (module-level var), never localStorage.
    # Lost on page refresh — the httpOnly refresh_token cookie is used to silently get a new one.

    response.set_cookie(
        "refresh_token",
        tokens["refresh"],
        httponly=True,  # JavaScript cannot read this cookie (XSS protection)
        secure=True,  # HTTPS only
        samesite="None",  # required for cross-origin Vercel → Render requests
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
    )
    return response


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_token_view(request: Request) -> Response:
    """
    Silent token refresh — called on every page load.
    Reads the httpOnly refresh_token cookie (React cannot access it directly),
    validates it, and returns a new access token in the response body.
    Returns 401 if the cookie is missing or the token is invalid/expired.
    """
    refresh_token = request.COOKIES.get("refresh_token")

    if not refresh_token:
        return Response({"error": "No refresh token"}, status=401)

    try:
        refresh = RefreshToken(refresh_token)
        # RefreshToken() validates the token — raises TokenError if invalid or expired
        access_token = str(refresh.access_token)
        return Response({"access": access_token})
    except Exception:
        return Response({"error": "Invalid refresh token"}, status=401)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def api_logout_view(request: Request) -> Response:
    """
    API logout — called by React's handleLogout.
    Deletes the httpOnly refresh_token cookie server-side (JavaScript cannot
    delete httpOnly cookies directly) and clears the Django session.
    Returns JSON so React can handle the UI reset itself.
    """
    response = Response({"detail": "Logged out"})
    response.delete_cookie(
        "refresh_token",
        samesite="None",  # must match how the cookie was originally set
    )
    logout(request)  # clear Django session — belt and braces
    return response


urlpatterns = [
    path("admin/", admin.site.urls),
    # Custom auth views — must come BEFORE path('accounts/') and path('api/')
    # Django matches top-to-bottom; first match wins.
    path("accounts/logout/", logout_view, name="logout"),
    path(
        "accounts/google/login/success/",
        google_login_success,
        name="google_login_success",
    ),
    # Allauth URLs — handles /accounts/google/login/, /accounts/google/login/callback/ etc.
    # Allauth does the Google part (code exchange, user lookup/creation, redirect).
    # Our custom google_login_success view does the JWT part.
    path("accounts/", include("allauth.urls")),
    # JWT token endpoints — must come BEFORE path('api/')
    path("api/token/exchange/", exchange_code, name="exchange_code"),
    path("api/token/refresh/", refresh_token_view, name="refresh_token"),
    path("api/auth/logout/", api_logout_view, name="api_logout"),
    # CV API — delegates to cv_api/urls.py
    path("api/", include("cv_api.urls")),
]


# STEP 1 — user clicks "Sign in with Google" in React
#          → <a href={`${API_URL}/accounts/google/login/`}> in App.jsx
#          → hits /accounts/google/login/
#          → allauth handles this entirely — we just registered it with path('accounts/', include('allauth.urls')) in core/urls.py

# STEP 2 — allauth builds the Google OAuth URL and redirects the user there
#          → allauth constructs: https://accounts.google.com/o/oauth2/auth?client_id=...&response_type=code&scope=email+profile...
#          → response_type=code is allauth's default — requests a one-time code back from Google
#          → OAUTH_PKCE_ENABLED: False and SCOPE: ['profile', 'email'] in settings.py SOCIALACCOUNT_PROVIDERS controls what allauth puts in this URL
#          → user sees Google's login screen — our app is completely out of the picture here

# STEP 3 — user approves on Google → Google redirects back to your Django backend
#          → Google hits /accounts/google/login/callback/?code=4/0Aci98...&state=...
#          → allauth handles this entirely via path('accounts/', include('allauth.urls')) in core/urls.py
#          → allauth validates the Google code server-to-server (never visible in browser)
#          → allauth creates or finds the Django user in your DB (SOCIALACCOUNT_AUTO_SIGNUP = True in settings.py means auto-create)
#          → allauth redirects to LOGIN_REDIRECT_URL = '/accounts/google/login/success/' (defined in settings.py)

#          → google_login_success view runs (defined in core/urls.py):
#              @login_required — allauth already logged the user in, so request.user is available
#              RefreshToken.for_user(request.user) — simplejwt generates a JWT pair for this user
#              secrets.token_urlsafe(32) — we generate a cryptographically secure one-time code
#              redis_client.setex(f'code:{code}', 60, json.dumps(tokens)) — we store JWT pair in Redis for 60 seconds
#              redirect(f'https://odin-cv-generator-iota.vercel.app?code={code}') — we redirect React with just the short code
#              token never touches the URL — only the short Redis key does

# STEP 4 — React loads with ?code=abc123 in URL
#          → useAuth useEffect runs on mount ([] dependency array) in useAuth.js
#          → window.location.search picks up the ?code=abc123 query string from the URL bar
#          → new URLSearchParams(window.location.search) parses it into a dictionary-like object
#          → params.get('code') extracts just the code value: "abc123"
#          → window.history.replaceState({}, '', '/') strips it from URL bar immediately
#              replaceState changes URL without reloading page or adding browser history entry
#              code is sensitive — removing it prevents it sitting in browser history, server logs, referrer headers
#          → React POSTs to /api/token/exchange/ with body: { code: "abc123" }
#              credentials: 'include' needed so Django can SET the httpOnly refresh_token cookie in the response
#              no authHeaders() here — user isn't logged in yet, no Bearer token exists

# STEP 5 — Django receives the code at exchange_code view (defined by us in core/urls.py)
#          → request.data.get('code') reads the code from the POST body
#          → redis_client.getdel(f'code:{code}') atomically gets and deletes the Redis entry
#              atomic = get and delete happen as one operation — prevents race conditions where two requests use the same code simultaneously
#              returns None if code not found (already used) or expired (60s TTL elapsed)
#          → if None: returns Response({'error': 'Invalid or expired code'}, status=400)
#              no 'access' key in response → React's data.access is undefined → setAuthError() shows error message
#          → if valid: returns Response({'access': tokens['access']})
#              JWT access token in response body — React stores in memory, never in localStorage
#          → response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='None', max_age=7days)
#              httponly=True — JavaScript can never read this cookie (XSS protection)
#              secure=True — HTTPS only
#              samesite='None' — required for cross-origin requests (Vercel frontend → Render backend)
#              max_age=7days — cookie persists for 7 days, survives page refreshes and browser restarts

# STEP 6 — React receives the response back in useAuth.js
#          → .then((res) => res.json()) parses the response body
#          → .then((data) => { ... }) receives the parsed object: { access: "eyJ..." }
#          → data.access exists and is truthy →
#          → accessToken = data.access stores JWT in module-level variable in useAuth.js
#              module-level = survives re-renders but lost on page refresh (intentional — cookie handles refresh)
#              not useState — token changes shouldn't trigger re-renders
#          → setUser('loggedIn') triggers useEffect([user]) in App.jsx
#          → App.jsx fetches GET /api/cv/ with ...authHeaders() which spreads { Authorization: 'Bearer eyJ...' } into headers
#          → cv_view in cv_api/views.py receives request
#              JWTAuthentication reads the Bearer token from Authorization header
#              validates it and populates request.user with the logged in Django user
#              CV.objects.get(user=request.user) fetches their CV from DB
#              CVSerializer serializes CV object → Python dict → JSON
#          → React receives CV data, populates form state, user sees their CV
#          → setHasSavedCV(true) — hides the demo banner

# STEP 7 — user refreshes the page
#          → accessToken gone — it was only in memory (module-level var in useAuth.js), not localStorage or cookie
#          → useAuth useEffect runs again on mount
#          → no ?code= in URL → params.get('code') returns null → takes path 2
#          → React POSTs to /api/token/refresh/ — mapped to refresh_token_view we wrote in core/urls.py
#              credentials: 'include' sends the httpOnly refresh_token cookie automatically
#              browser attaches it without JS ever reading it — JS literally cannot access httpOnly cookies
#          → refresh_token_view (defined by us in core/urls.py):
#              request.COOKIES.get('refresh_token') — Django reads the cookie directly, JS never could
#              if missing: returns 401 → res.ok is false → setUser(null) → login button shows
#              RefreshToken(refresh_token) validates the token — raises TokenError if invalid or expired
#              if expired: returns 401 → same path → login button shows
#              if valid: returns Response({'access': access_token}) — fresh JWT in response body
#          → React receives fresh access token
#              accessToken = data.access stores it in memory again
#              setUser('loggedIn') → useEffect([user]) fires → CV fetched → user silently logged back in
#              user never saw a login prompt

# STEP 8 — user clicks logout button in App.jsx
#          → App.jsx handleLogout() calls authLogout() from useAuth.js first
#          → useAuth.js handleLogout() POSTs to /api/auth/logout/
#              credentials: 'include' sends the httpOnly cookie so Django can delete it
#              headers: authHeaders() sends Bearer token so Django knows who is logging out
#          → api_logout_view (defined by us in core/urls.py):
#              response.delete_cookie('refresh_token', samesite='None')
#                  samesite='None' must match how cookie was originally set — browser rejects mismatched delete
#                  only the server can delete an httpOnly cookie — JS has no access to it at all
#              logout(request) clears the Django session as well — belt and braces
#              returns Response({'detail': 'Logged out'})
#          → .finally() in useAuth.js runs regardless of whether server responded successfully:
#              accessToken = null — wipes JWT from memory
#              setUser(null) — React re-renders, login button appears
#          → back in App.jsx handleLogout() resets local CV state:
#              setHasSavedCV(false) — clears saved CV flag
#              setPersonalInfo(SHERLOCK_DATA.personalInfo) — resets form to Sherlock demo data
#              setSections(SHERLOCK_DATA.sections) — resets sections to Sherlock demo data
