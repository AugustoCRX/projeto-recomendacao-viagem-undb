"""
deps.py
────────
FastAPI ``Depends`` providers used across views.

* ``get_db()``         — yields a SQLAlchemy session and ensures it is closed
                         after the request, even on exceptions.
* ``get_current_user`` — reads the user_id set by ``JWTMiddleware`` on
                         ``request.state`` and loads the User row. Returns the
                         typed ORM instance so views get a real ``User``
                         object instead of a raw id string.
"""

from typing import Generator
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from db import SessionLocal
from models.user import User


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        user_uuid = UUID(str(user_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
