from __future__ import annotations

# alembic/env.py — Alembic migration runner
#
# Alembic is the migration tool for SQLAlchemy (like Django's `migrate`).
#
# Common commands:
#   alembic revision --autogenerate -m "description"  — generate a migration from model changes
#   alembic upgrade head                              — apply all pending migrations
#   alembic downgrade -1                              — roll back one migration
#
# This file tells Alembic where to find the DB and what models to compare against.

import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add the backend directory to sys.path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import Base  # noqa: E402
import models  # noqa: F401, E402 — import all models so Base.metadata sees them

config = context.config
fileConfig(config.config_file_name)

# target_metadata tells Alembic which tables exist — compares against the real DB
# to generate migrations automatically with --autogenerate
target_metadata = Base.metadata


def get_url() -> str:
    url = os.environ.get("DATABASE_URL", "postgresql://localhost/cv_db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL script instead)."""
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
