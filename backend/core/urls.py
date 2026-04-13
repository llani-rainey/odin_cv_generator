from django.contrib import admin
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.urls import path, include
from django.contrib.auth.decorators import login_required  # Django built-in decorator — blocks unauthenticated users, redirects to login
from rest_framework_simplejwt.tokens import RefreshToken  # simplejwt class — generates JWT token pairs (access + refresh) for a user
from rest_framework.decorators import api_view, authentication_classes, permission_classes
# api_view — DRF decorator, transforms plain function into DRF view
#             makes request.data available, handles CSRF exemption, filters methods
# authentication_classes — DRF decorator, controls how user is identified
# permission_classes — DRF decorator, controls who is allowed through
from rest_framework.permissions import AllowAny  # DRF built-in — lets everyone through, no login required
from rest_framework.response import Response  # DRF response — auto converts Python dict to JSON
import secrets  # Python built-in module — generates cryptographically secure random strings, safer than random module for security purposes
import json  # Python built-in module — converts between Python dicts and JSON strings (json.dumps = dict→string, json.loads = string→dict)
import redis  # third party package — Python client for Redis, installed via pip install redis
import os  # Python built-in module — access environment variables via os.environ.get()

# connect to Redis on module load — runs once when Django starts
# redis.from_url() — redis built-in function, parses a Redis connection URL and returns a client object
# os.environ.get('REDIS_URL', 'redis://localhost:6379') — reads REDIS_URL env var set on Render
# falls back to localhost:6379 for local development
# redis_client is now a connection object with methods: setex(), getdel(), get(), set(), delete() etc
redis_client = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379'))


def logout_view(request):
    # plain Django view — not a DRF view, no @api_view decorator needed
    # request injected by Django because logout_view is registered in urlpatterns
    # used for allauth browser-based logout — does a full page redirect
    # separate from api_logout_view which returns JSON for React to handle
    response = redirect('https://odin-cv-generator-iota.vercel.app')
    # redirect() — Django built-in, returns an HTTP 302 response pointing browser to new URL
    response.delete_cookie('refresh_token', samesite='None')
    # delete_cookie() — Django built-in method on response object
    # tells browser to delete the refresh_token cookie by setting its expiry to the past
    # samesite='None' must match how the cookie was originally set — otherwise browser ignores the deletion
    logout(request)
    # logout() — Django built-in imported at top, clears the session from DB and session cookie
    return response


@login_required
# Django built-in decorator imported at top
# checks request.user.is_authenticated before running the view
# if not authenticated → redirects to login page automatically
# safety net — this view should only ever be hit after successful Google OAuth
# prevents someone hitting /accounts/google/login/success/ directly and crashing
def google_login_success(request):
    # called after Google OAuth completes — LOGIN_REDIRECT_URL in settings.py points here
    # at this point request.user is the logged in Django User object
    # set by allauth after processing the Google callback

    code = secrets.token_urlsafe(32)
    # secrets — Python built-in module, cryptographically secure random string generator
    # token_urlsafe(32) — generates 32 bytes of random data, base64 encoded → ~43 character string
    # safer than random.random() which is not cryptographically secure
    # this code goes in the URL so it must be unguessable

    refresh = RefreshToken.for_user(request.user)
    # RefreshToken — simplejwt class imported at top
    # .for_user() — class method, takes a User object, generates a JWT token pair
    # refresh contains both the refresh token and access token
    # str(refresh) → the refresh token string
    # str(refresh.access_token) → the access token string

    tokens = {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

    # store tokens in Redis against the one-time code
    redis_client.setex(
        f'code:{code}',     # key — namespaced with 'code:' prefix to avoid collisions with other Redis keys
                            # f-string interpolates code value: 'code:abc123xyz...'
        60,                 # TTL (time to live) in seconds — Redis auto-deletes this key after 60 seconds
                            # code expires even if React never exchanges it — security measure
        json.dumps(tokens)  # value — Redis only stores strings, so we serialize the dict to JSON string
                            # json.dumps() — Python built-in, converts dict → JSON string
                            # '{"refresh": "eyJ...", "access": "eyJ..."}'
    )

    # redirect React with just the code in URL — never the token itself
    # token in URL = visible in browser history, server logs, referrer headers — bad
    # code in URL = safe, short-lived (60s), one-time use, useless without exchange
    return redirect(
        f'https://odin-cv-generator-iota.vercel.app?code={code}'
    )


@api_view(['POST'])
# DRF decorator — only accepts POST requests, returns 405 for anything else
# makes request.data available — parsed JSON body, no need for json.loads(request.body)
# handles CSRF exemption automatically — correct approach vs @csrf_exempt
# this is why we switched from plain Django views — DRF handles CSRF properly for API endpoints
@authentication_classes([])
# empty list — no authentication needed for this endpoint
# this is a pre-auth endpoint — user isn't logged in yet when they hit this
# no session cookie, no JWT token — just a one-time code from Redis
@permission_classes([AllowAny])
# AllowAny — let everyone through the door
# we do our own validation inside (checking the Redis code)
def exchange_code(request):
    # React POSTs the one-time code here immediately after being redirected back
    # Django validates code against Redis, returns access token in response body
    # sets refresh token as httpOnly cookie — JavaScript can never read it (XSS protection)
    # code is removed after use — atomic get-and-delete prevents reuse

    code = request.data.get('code')
    # request.data — DRF parsed JSON body, available because of @api_view decorator
    # .get() — safe dict access, returns None if key missing
    # replaces json.loads(request.body) — DRF does the parsing automatically

    if not code:
        return Response({'error': 'No code provided'}, status=400)
    # Response — DRF built-in imported at top, auto converts dict to JSON
    # replaces JsonResponse — consistent with DRF pattern

    token_data = redis_client.getdel(f'code:{code}')
    # getdel() — Redis built-in method on the client object
    # atomic operation: gets the value AND deletes the key in one step
    # atomic means both happen together — no other request can get the value between the get and delete
    # prevents race condition where two requests try to use the same code simultaneously
    # returns the value if key exists, None if key doesn't exist or already expired
    # 'code:{code}' — same namespaced key format used in setex() above

    if not token_data:
        return Response({'error': 'Invalid or expired code'}, status=400)
        # None = key didn't exist — either:
        # 1. code was wrong
        # 2. code already used (getdel deleted it)
        # 3. 60 second TTL expired — Redis auto-deleted it

    tokens = json.loads(token_data)
    # token_data comes back from Redis as bytes — json.loads() parses it back to dict
    # opposite of json.dumps() used in setex() above

    response = Response({'access': tokens['access']})
    # access token returned in response body — React reads it and stores in state (memory)
    # never stored in localStorage — vulnerable to cross-site scripting (XSS)
    # lives only in React state — lost on page refresh (handled by refresh token below)

    response.set_cookie(
        'refresh_token',
        tokens['refresh'],
        httponly=True,              # JavaScript can't read this cookie — XSS protection
                                    # even if attacker injects JS, they can't steal the refresh token
        secure=True,                # only sent over HTTPS — never HTTP
        samesite='None',            # cross-origin — required for Vercel → Render requests
                                    # must be paired with secure=True when samesite='None'
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds (7 days × 24 hours × 60 mins × 60 secs)
                                    # browser auto-deletes cookie after 7 days
    )
    return response


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_token_view(request):
    # React calls this on every page load to silently get a new access token
    # access token lives in React state — lost on page refresh
    # refresh token lives in httpOnly cookie — persists across refreshes
    # React can't read the httpOnly cookie directly — Django reads it and returns a new access token
    # this is the 'silent refresh' pattern — user never sees a login prompt on refresh
    # @authentication_classes([]) — no auth needed, the refresh token cookie IS the auth
    # @permission_classes([AllowAny]) — everyone allowed, we validate via cookie inside

    refresh_token = request.COOKIES.get('refresh_token')
    # request.COOKIES — Django built-in dict of all cookies sent with the request
    # .get('refresh_token') — safe access, returns None if cookie missing
    # browser sends this cookie automatically because samesite='None' and secure=True

    if not refresh_token:
        return Response({'error': 'No refresh token'}, status=401)
        # no cookie = user has never logged in, or cookie expired after 7 days
        # React handles 401 here by showing the Sign in with Google button

    try:
        refresh = RefreshToken(refresh_token)
        # RefreshToken() — simplejwt class, validates the refresh token string
        # raises TokenError if token is invalid, expired, or tampered with
        # if valid — refresh object contains the user info encoded in the token

        access_token = str(refresh.access_token)
        # .access_token — simplejwt property, generates a new access token from the refresh token
        # str() — converts the token object to the JWT string: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'

        return Response({'access': access_token})
        # return new access token in body — React stores it in state
        # React then uses it in Authorization: Bearer header for all subsequent requests

    except Exception:
        # TokenError or any other exception — refresh token is invalid or expired
        return Response({'error': 'Invalid refresh token'}, status=401)
        # React handles 401 by showing Sign in with Google button
        # user needs to log in again to get a new refresh token


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_logout_view(request):
    # API logout — called by React's handleLogout function
    # deletes the httpOnly refresh_token cookie server-side
    # JavaScript can't delete httpOnly cookies directly — only the server can
    # separate from logout_view which does a browser redirect (used for allauth flows)
    # this returns JSON — React handles the UI reset itself (clears accessToken, shows login button)
    # @authentication_classes([]) — no auth needed, anyone can log out
    # @permission_classes([AllowAny]) — everyone allowed through

    response = Response({'detail': 'Logged out'})
    response.delete_cookie(
        'refresh_token',
        samesite='None',    # must match how cookie was originally set in exchange_code
                            # if samesite doesn't match, browser may not delete the cookie
    )
    logout(request)         # clear Django session too — belt and braces
    return response


urlpatterns = [
    path('admin/', admin.site.urls),

    path('accounts/logout/', logout_view, name='logout'),
    # (route, view/what to run, optional nickname so can reference this url elsewhere without hardcoding the string)
    # logout_view is function defined above using the built in logout(request) imported utility function at the top
    # must come BEFORE path('accounts/') — Django checks top to bottom,
    # first match wins. If accounts/ came first it would swallow logout/ before
    # this line is ever checked.

    path('accounts/google/login/success/', google_login_success, name='google_login_success'),
    # called after Google OAuth completes — allauth redirects here via LOGIN_REDIRECT_URL
    # must come BEFORE path('accounts/') for same reason as logout above
    # generates JWT tokens, stores against one-time code in Redis with 60s TTL
    # redirects React with just the code in URL — never the token itself

    path('accounts/', include('allauth.urls')),
    # reverse('logout') would return '/accounts/logout/'
    # include accepts either a string or an actual module, when you pass a string,
    # Django does the import internally for you, no need to do it yourself at the top
    # (which is more verbose: from allauth import urls as allauth_urls)
    # /accounts/* → delegated to allauth's bundled urls.py (inside .venv)
    # 'accounts/' is just a prefix/namespace, not a view itself — hitting
    # /accounts/ alone would 404. The actual views live inside allauth:
    #     /accounts/google/login/          → allauth's GoogleLoginView
    #     /accounts/google/login/callback/ → allauth's OAuth callback view
    #     /accounts/login/                 → allauth's login view
    # 'allauth.urls' is a Python import path — find the urls module
    # inside the allauth package, same as `import allauth` would

    path('api/token/exchange/', exchange_code, name='exchange_code'),
    # React POSTs one-time code here immediately after Google login redirect
    # must come BEFORE path('api/') — same reason as accounts/ above
    # returns access token in body, sets refresh token as httpOnly cookie
    # atomic getdel prevents code reuse — one-time only

    path('api/token/refresh/', refresh_token_view, name='refresh_token'),
    # React POSTs here on page load to silently get new access token
    # reads refresh token from httpOnly cookie — React can't read it directly
    # must come BEFORE path('api/')
    # returns new access token in body — React stores in state

    path('api/auth/logout/', api_logout_view, name='api_logout'),
    # React POSTs here when user clicks Logout
    # must come BEFORE path('api/')
    # deletes httpOnly refresh_token cookie server-side
    # returns JSON — React then clears accessToken and resets UI

    path('api/', include('cv_api.urls')),
    # include means don't handle this here, delegate it to another urls.py file
    # any request starting with /api/ → handed off to cv_api/urls.py
]