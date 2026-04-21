from __future__ import annotations

# tests/test_api.py — API integration tests
#
# Mirrors the Django test suite (21 tests → same coverage, FastAPI patterns).
#
# Key differences from Django's TestCase:
#
#   pytest fixtures vs setUp() — pytest fixtures are functions that yield data/objects.
#   Each test receives fixtures as arguments (dependency injection). No inheritance
#   from TestCase — just plain functions decorated/named test_*.
#
#   TestClient vs APIClient — both simulate HTTP requests without a real server.
#   TestClient is synchronous even though FastAPI is async under the hood.
#
#   monkeypatch vs unittest.mock.patch — monkeypatch is pytest's built-in way to
#   temporarily replace attributes/functions. Used here to mock Redis.

import json
from unittest.mock import patch

from auth import create_access_token, create_refresh_token
from models import CV, User

MINIMAL_CV = {
    "name": "Jane Doe",
    "title": "Developer",
    "location": "",
    "phone": "",
    "email": "",
    "address": "",
    "visaStatus": "",
    "font": "Arial",
    "fontSize": "11px",
    "margins": "narrow",
    "accentColor": "#000000",
    "links": [],
    "sections": [],
}


# ── Model / schema smoke tests ─────────────────────────────────────────────────


def test_user_creation(db):
    """A User can be created and retrieved."""
    user = User(email="hello@example.com", google_id="gid-1")
    db.add(user)
    db.commit()
    db.refresh(user)
    assert user.id is not None
    assert user.email == "hello@example.com"


def test_cv_linked_to_user(db, user):
    """A CV is correctly linked to its user via FK."""
    cv = CV(user_id=user.id, name="Sherlock Holmes")
    db.add(cv)
    db.commit()
    db.refresh(cv)
    assert cv.user_id == user.id
    assert cv.name == "Sherlock Holmes"


# ── GET /api/cv/ ──────────────────────────────────────────────────────────────


def test_get_cv_authenticated_returns_200(client, user_with_cv, auth_headers):
    """Authenticated user with a CV gets 200 and their CV data."""
    response = client.get("/api/cv/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Jane Doe"


def test_get_cv_unauthenticated_returns_401(client):
    """No Authorization header → 401."""
    response = client.get("/api/cv/")
    assert response.status_code == 401


def test_get_cv_no_cv_returns_404(client, user, auth_headers):
    """Authenticated user with no saved CV → 404."""
    response = client.get("/api/cv/", headers=auth_headers)
    assert response.status_code == 404


def test_get_cv_invalid_token_returns_401(client):
    """Invalid Bearer token → 401."""
    response = client.get("/api/cv/", headers={"Authorization": "Bearer not.a.token"})
    assert response.status_code == 401


# ── POST /api/cv/ ─────────────────────────────────────────────────────────────


def test_post_cv_creates_cv(client, user, auth_headers, db):
    """Posting a CV for the first time creates it in the database."""
    response = client.post("/api/cv/", json=MINIMAL_CV, headers=auth_headers)
    assert response.status_code == 200
    assert db.query(CV).filter(CV.user_id == user.id).count() == 1


def test_post_cv_updates_existing_cv(client, user, auth_headers, db):
    """Posting again for the same user updates the existing CV (no duplicates)."""
    client.post("/api/cv/", json=MINIMAL_CV, headers=auth_headers)
    updated = {**MINIMAL_CV, "name": "Updated Name"}
    response = client.post("/api/cv/", json=updated, headers=auth_headers)
    assert response.status_code == 200
    # .count() == 1 proves no duplicate was created
    assert db.query(CV).filter(CV.user_id == user.id).count() == 1
    assert db.query(CV).filter(CV.user_id == user.id).first().name == "Updated Name"


def test_post_cv_unauthenticated_returns_401(client):
    """No token → 401."""
    response = client.post("/api/cv/", json=MINIMAL_CV)
    assert response.status_code == 401


def test_post_cv_with_nested_sections_and_bullets(client, user, auth_headers, db):
    """Nested sections → entries → bullets are all written to the DB correctly."""
    payload = {
        **MINIMAL_CV,
        "sections": [
            {
                "title": "Experience",
                "type": "experience",
                "order": 0,
                "entries": [
                    {
                        "jobTitle": "Engineer",
                        "company": "Acme",
                        "companyURL": "",
                        "location": "London",
                        "startDate": "2023",
                        "endDate": "Present",
                        "text": "",
                        "order": 0,
                        "bullets": [{"text": "Built things", "order": 0}],
                    }
                ],
            }
        ],
    }
    response = client.post("/api/cv/", json=payload, headers=auth_headers)
    assert response.status_code == 200

    cv = db.query(CV).filter(CV.user_id == user.id).first()
    assert len(cv.sections) == 1
    assert len(cv.sections[0].entries) == 1
    assert len(cv.sections[0].entries[0].bullets) == 1
    assert cv.sections[0].entries[0].bullets[0].text == "Built things"


def test_post_cv_response_uses_camel_case(client, user, auth_headers):
    """Response body uses camelCase field names (what React expects)."""
    response = client.post("/api/cv/", json=MINIMAL_CV, headers=auth_headers)
    data = response.json()
    assert "fontSize" in data  # not font_size
    assert "accentColor" in data  # not accent_color
    assert "visaStatus" in data  # not visa_status


# ── POST /api/token/exchange/ ─────────────────────────────────────────────────


@patch("routes.auth.redis_client")
def test_exchange_valid_code_returns_access_token_and_sets_cookie(
    mock_redis, client, user
):
    """Valid one-time code → 200, access token in body, refresh cookie set."""
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    mock_redis.getdel.return_value = json.dumps(
        {"access": access, "refresh": refresh}
    ).encode()

    response = client.post("/api/token/exchange/", json={"code": "valid-code"})

    assert response.status_code == 200
    assert "access" in response.json()
    assert "refresh_token" in response.cookies


@patch("routes.auth.redis_client")
def test_exchange_invalid_code_returns_400(mock_redis, client):
    """Code not found in Redis → 400."""
    mock_redis.getdel.return_value = None  # Redis returns None when key doesn't exist

    response = client.post("/api/token/exchange/", json={"code": "bad-code"})
    assert response.status_code == 400


# ── POST /api/token/refresh/ ──────────────────────────────────────────────────


def test_refresh_valid_cookie_returns_new_access_token(client, user):
    """Valid refresh_token cookie → 200 with new access token."""
    refresh = create_refresh_token(user.id)
    client.cookies.set("refresh_token", refresh)

    response = client.post("/api/token/refresh/")

    assert response.status_code == 200
    assert "access" in response.json()


def test_refresh_missing_cookie_returns_401(client):
    """No cookie → 401."""
    response = client.post("/api/token/refresh/")
    assert response.status_code == 401


def test_refresh_invalid_token_returns_401(client):
    """Malformed cookie → 401."""
    client.cookies.set("refresh_token", "not.a.valid.jwt")
    response = client.post("/api/token/refresh/")
    assert response.status_code == 401


# ── POST /api/auth/logout/ ────────────────────────────────────────────────────


def test_logout_returns_200(client):
    """Logout endpoint returns 200 even without a cookie."""
    response = client.post("/api/auth/logout/")
    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"


def test_logout_clears_refresh_cookie(client):
    """
    Logout sends Set-Cookie with the refresh_token to delete it.
    HTTP cookie deletion works by setting max-age=0 — no actual DELETE command exists.
    The browser receives the header and discards the cookie.
    """
    client.cookies.set("refresh_token", "some-token")
    response = client.post("/api/auth/logout/")
    # Check the raw Set-Cookie header for the deletion signal
    set_cookie = response.headers.get("set-cookie", "")
    assert "refresh_token" in set_cookie
    assert "max-age=0" in set_cookie.lower()
