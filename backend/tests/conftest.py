from __future__ import annotations

import os

# Set test DB BEFORE importing any app module — database.py creates the engine
# at module load time, so this must come first or it tries to connect to PostgreSQL.
# load_dotenv() won't override an already-set env var, so .env is safely ignored.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

# tests/conftest.py — pytest fixtures shared across all test files
#
# conftest.py is automatically loaded by pytest before running tests.
# Fixtures defined here are available to every test file without importing.
#
# Key testing concepts used here:
#
#   Dependency override — FastAPI lets you replace any dependency with a test version.
#   app.dependency_overrides[get_db] = override_get_db swaps the real PostgreSQL
#   session for a SQLite in-memory session during tests. Tests never touch the real DB.
#
#   SQLite for tests — PostgreSQL for production. SQLite is a single file, no server
#   needed. Because our models use no PostgreSQL-specific features, SQLite works fine.
#
#   TestClient — a synchronous HTTP client that talks directly to the ASGI app without
#   starting a real server. From starlette (bundled with FastAPI), based on httpx.

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from auth import create_access_token
from database import Base, get_db
from main import app
from models import CV, User

# SQLite in-memory DB for tests — wiped clean between test functions
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },  # required for SQLite with multiple threads
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Test version of get_db — uses the SQLite engine instead of PostgreSQL."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Swap out the real database dependency globally for the test session
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """
    Create all tables before each test, drop them after.
    autouse=True — runs for every test automatically without needing to request it.
    This gives each test a completely fresh, empty database.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Yield a DB session for tests that need to insert data directly."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    """FastAPI TestClient — makes HTTP requests to the app without a real server."""
    return TestClient(app)


@pytest.fixture
def user(db):
    """Create and return a test User."""
    u = User(email="test@example.com", google_id="google-123")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def auth_headers(user):
    """Return Authorization header for the test user."""
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_with_cv(db, user):
    """Create a test User with a saved CV."""
    cv = CV(user_id=user.id, name="Jane Doe", title="Developer")
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return user, cv
