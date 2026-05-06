"""
tests/test_auth.py — TC-01..TC-07

Covers registration, login, JWT middleware behaviour, and password hashing.
"""

from datetime import datetime, timedelta, timezone

from jose import jwt

from core.config import JWT_ALGORITHM, SECRET_KEY


# ── TC-01 ─────────────────────────────────────────────────────────────────────
def test_tc01_register_valid(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"name": "Bia", "email": "bia@example.com", "password": "pass1234"},
    )
    assert r.status_code == 201
    body = r.json()
    assert "token" in body and body["token"]
    assert body["user"]["email"] == "bia@example.com"
    # password / hash never returned
    assert "password" not in body["user"] and "password_hash" not in body["user"]


# ── TC-02 ─────────────────────────────────────────────────────────────────────
def test_tc02_register_duplicate_email(client, register_user):
    register_user(email="dup@example.com")
    r = client.post(
        "/api/v1/auth/register",
        json={"name": "Other", "email": "dup@example.com", "password": "pass1234"},
    )
    assert r.status_code == 409


# ── TC-03 ─────────────────────────────────────────────────────────────────────
def test_tc03_login_valid(client, register_user):
    register_user(email="login@example.com", password="pass1234")
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "pass1234"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token"]
    assert body["user"]["email"] == "login@example.com"


# ── TC-04 ─────────────────────────────────────────────────────────────────────
def test_tc04_login_wrong_password(client, register_user):
    register_user(email="wrong@example.com", password="rightpass1")
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpass1"},
    )
    assert r.status_code == 401


# ── TC-05 ─────────────────────────────────────────────────────────────────────
def test_tc05_protected_route_no_header(client):
    r = client.get("/api/v1/trips")
    assert r.status_code == 401
    assert "Not authenticated" in r.json()["detail"]


# ── TC-06 ─────────────────────────────────────────────────────────────────────
def test_tc06_protected_route_malformed_token(client):
    r = client.get(
        "/api/v1/trips",
        headers={"Authorization": "Bearer not-a-real-jwt"},
    )
    assert r.status_code == 401


def test_tc06_protected_route_expired_token(client):
    expired = jwt.encode(
        {
            "sub": "00000000-0000-0000-0000-000000000000",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    r = client.get("/api/v1/trips", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


# ── TC-07 ─────────────────────────────────────────────────────────────────────
def test_tc07_password_is_hashed_not_plain(client, db_session, register_user):
    register_user(email="hash@example.com", password="pass1234")
    from models.user import User

    row = db_session.query(User).filter(User.email == "hash@example.com").first()
    assert row is not None
    assert row.password_hash != "pass1234"
    # bcrypt hashes start with $2
    assert row.password_hash.startswith("$2")
