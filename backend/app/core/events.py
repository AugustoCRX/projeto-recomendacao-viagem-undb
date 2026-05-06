"""
core/events.py
──────────────
FastAPI startup hook. Initialises the database schema (idempotent
``Base.metadata.create_all``) so a fresh container can boot without manual
``alembic upgrade head`` — handy for local Docker and CI. In production the
preferred path is still Alembic migrations.
"""

from typing import Callable

from fastapi import FastAPI
from loguru import logger
from sqlalchemy.exc import OperationalError

import models  # noqa: F401  ensures all model classes register with Base.metadata
from db import Base, engine


def create_start_app_handler(app: FastAPI) -> Callable[[], None]:
    def start_app() -> None:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("database schema ensured (create_all)")
        except OperationalError:
            logger.exception("failed to initialize database — continuing without create_all")

    return start_app
