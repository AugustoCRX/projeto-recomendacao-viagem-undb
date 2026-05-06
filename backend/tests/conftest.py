"""
tests/conftest.py
─────────────────
Global fixtures: in-memory SQLite session, TestClient with `get_db` overridden,
and a ready-to-use ``auth_headers`` fixture that registers a user and returns
the Bearer header.

Tests stay hermetic — no real Postgres, no outbound HTTP, no real LLM.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Make ``app/`` importable as top-level (matches Dockerfile PYTHONPATH).
_APP = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(_APP))

# Provide minimal env so ``core/config`` is importable.
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DEBUG", "True")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from db import Base  # noqa: E402
from deps import get_db  # noqa: E402
from main import app  # noqa: E402
from services import cache as svc_cache  # noqa: E402


@pytest.fixture
def db_engine():
    # StaticPool keeps a single connection alive — required for in-memory
    # SQLite so create_all and subsequent queries see the same database.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # SQLite ignores ON DELETE CASCADE unless foreign_keys is explicitly enabled.
    @event.listens_for(engine, "connect")
    def _enable_fks(dbapi_conn, _):  # pragma: no cover
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)
    sess = Session()
    try:
        yield sess
    finally:
        sess.close()


@pytest.fixture
def client(db_engine):
    """TestClient wired to the in-memory SQLite session."""
    Session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)

    def _override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_db
    svc_cache.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    svc_cache.clear()


_DEFAULT_USER = {
    "name": "Ana Tester",
    "email": "ana@example.com",
    "password": "pass1234",
}


@pytest.fixture
def register_user(client):
    """Factory: register a user and return (user_dict, token)."""

    def _register(**overrides) -> tuple[dict, str]:
        payload = {**_DEFAULT_USER, **overrides}
        r = client.post("/api/v1/auth/register", json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        return body["user"], body["token"]

    return _register


@pytest.fixture
def auth_headers(register_user) -> dict:
    _, token = register_user()
    return {"Authorization": f"Bearer {token}"}
