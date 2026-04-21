from __future__ import annotations

# database.py — SQLAlchemy engine and session setup
#
# SQLAlchemy is the Python ORM used instead of Django's built-in ORM.
# It maps Python classes (defined in models.py) to database tables.
#
# Two key concepts:
#   engine  — the connection to the actual database (one per process)
#   Session — a unit of work: holds pending changes until commit()
#             analogous to Django's request-scoped DB connection
#
# get_db() is a FastAPI dependency — yields a session per request,
# then closes it in the finally block regardless of success or error.

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

database_url = os.environ.get("DATABASE_URL", "postgresql://localhost/cv_db")

# Render provides DATABASE_URL starting with "postgres://" (legacy format).
# SQLAlchemy 1.4+ requires "postgresql://" — swap it here so both work.
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url)

# sessionmaker is a factory that produces Session objects with the same config.
# autocommit=False — changes are NOT written until session.commit() is called.
# autoflush=False  — SQLAlchemy won't auto-send SQL before every query.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class all SQLAlchemy models inherit from."""

    pass


def get_db() -> Session:
    """
    FastAPI dependency — yields one DB session per request, then closes it.
    Usage: def my_route(db: Session = Depends(get_db)): ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
