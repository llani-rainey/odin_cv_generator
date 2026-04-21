from __future__ import annotations

# main.py — FastAPI app entry point
#
# FastAPI equivalent of Django's settings.py + core/urls.py combined.
#
# Key differences from Django:
#   - No separate settings.py — config lives in each module via os.environ
#   - No URL patterns file — routers are registered with app.include_router()
#   - Middleware added via app.add_middleware(), not MIDDLEWARE list
#   - ASGI app (vs Django's WSGI) — can serve async handlers natively

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth as auth_routes
from routes import cv as cv_routes

app = FastAPI(title="CV Builder API")

# CORS — allow the React frontend (Vercel) to send requests with cookies.
# allow_credentials=True is required so the browser sends/receives httpOnly cookies
# cross-origin (Vercel → Render). Without this, document.cookie and Set-Cookie
# headers are silently blocked by the browser.
CORS_ORIGINS = list(
    {
        "http://localhost:5173",  # Vite dev server
        os.environ.get("FRONTEND_URL", "http://localhost:5173"),
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include_router() registers all routes defined in each router module.
# Equivalent to Django's include() in urlpatterns.
app.include_router(auth_routes.router)
app.include_router(cv_routes.router)


# ── Running the app ───────────────────────────────────────────────────────────
#
# Local development:
#   uvicorn main:app --reload --port 8000
#
# Production (Render):
#   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
#
# uvicorn — ASGI server (like Django's runserver but production-grade)
# gunicorn — process manager that spawns multiple uvicorn workers for concurrency
