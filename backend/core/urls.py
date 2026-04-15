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
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# Connect to Redis on module load — runs once when Django starts.
# Falls back to localhost for local development.
redis_client = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379'))


def logout_view(request: HttpRequest) -> HttpResponseRedirect:
    """
    Browser-based logout for allauth flows.
    Deletes the refresh_token cookie and clears the Django session,
    then redirects to the frontend.
    """
    response = redirect('https://odin-cv-generator-iota.vercel.app')
    response.delete_cookie('refresh_token', samesite='None')
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
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

    # Store tokens in Redis against the one-time code for 60 seconds.
    # Redis auto-deletes the key after the TTL — code expires even if React never exchanges it.
    redis_client.setex(
        f'code:{code}',
        60,
        json.dumps(tokens),
    )

    # Redirect with just the code — never the token itself.
    # Token in URL = visible in browser history, logs, referrer headers (bad).
    # Code in URL = safe, short-lived (60s), one-time use, useless without exchange.
    return redirect(f'https://odin-cv-generator-iota.vercel.app?code={code}')


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def exchange_code(request: Request) -> Response:
    """
    Exchange a one-time Redis code for a JWT access token.
    Returns the access token in the response body and sets the refresh token
    as an httpOnly cookie (inaccessible to JavaScript — XSS protection).
    The code is atomically deleted from Redis on use (one-time only).
    """
    code = request.data.get('code')
    if not code:
        return Response({'error': 'No code provided'}, status=400)

    # getdel() — atomic get-and-delete: prevents code reuse even in race conditions.
    # Returns None if key doesn't exist or has already expired.
    token_data = redis_client.getdel(f'code:{code}')

    if not token_data:
        return Response({'error': 'Invalid or expired code'}, status=400)

    tokens = json.loads(token_data)

    response = Response({'access': tokens['access']})
    # Access token in body — React stores in memory (module-level var), never localStorage.
    # Lost on page refresh — the httpOnly refresh_token cookie is used to silently get a new one.

    response.set_cookie(
        'refresh_token',
        tokens['refresh'],
        httponly=True,              # JavaScript cannot read this cookie (XSS protection)
        secure=True,                # HTTPS only
        samesite='None',            # required for cross-origin Vercel → Render requests
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
    )
    return response


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_token_view(request: Request) -> Response:
    """
    Silent token refresh — called on every page load.
    Reads the httpOnly refresh_token cookie (React cannot access it directly),
    validates it, and returns a new access token in the response body.
    Returns 401 if the cookie is missing or the token is invalid/expired.
    """
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response({'error': 'No refresh token'}, status=401)

    try:
        refresh = RefreshToken(refresh_token)
        # RefreshToken() validates the token — raises TokenError if invalid or expired
        access_token = str(refresh.access_token)
        return Response({'access': access_token})
    except Exception:
        return Response({'error': 'Invalid refresh token'}, status=401)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_logout_view(request: Request) -> Response:
    """
    API logout — called by React's handleLogout.
    Deletes the httpOnly refresh_token cookie server-side (JavaScript cannot
    delete httpOnly cookies directly) and clears the Django session.
    Returns JSON so React can handle the UI reset itself.
    """
    response = Response({'detail': 'Logged out'})
    response.delete_cookie(
        'refresh_token',
        samesite='None',  # must match how the cookie was originally set
    )
    logout(request)  # clear Django session — belt and braces
    return response


urlpatterns = [
    path('admin/', admin.site.urls),

    # Custom auth views — must come BEFORE path('accounts/') and path('api/')
    # Django matches top-to-bottom; first match wins.
    path('accounts/logout/', logout_view, name='logout'),
    path('accounts/google/login/success/', google_login_success, name='google_login_success'),

    # Allauth URLs — handles /accounts/google/login/, /accounts/google/login/callback/ etc.
    path('accounts/', include('allauth.urls')),

    # JWT token endpoints — must come BEFORE path('api/')
    path('api/token/exchange/', exchange_code, name='exchange_code'),
    path('api/token/refresh/', refresh_token_view, name='refresh_token'),
    path('api/auth/logout/', api_logout_view, name='api_logout'),

    # CV API — delegates to cv_api/urls.py
    path('api/', include('cv_api.urls')),
]
