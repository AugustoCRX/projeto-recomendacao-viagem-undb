"""
core/config.py
──────────────
Centralised configuration loaded from environment variables (.env).

All settings live here so the rest of the codebase never reads ``os.environ``
directly. This keeps the app cloud-portable: change a value via the host's env
config (Render, Fly, Docker, etc.) without code edits.
"""

import logging
import sys
from pathlib import Path

from loguru import logger
from starlette.config import Config
from starlette.datastructures import CommaSeparatedStrings, Secret

from core.logging import InterceptHandler

# Look for .env at the backend root (parent of /app). When running in Docker
# with ``env_file:`` already injecting vars, this path won't exist and Starlette
# silently falls back to ``os.environ`` — no warning either way.
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
config = Config(_ENV_PATH if _ENV_PATH.exists() else None)

# ── App ───────────────────────────────────────────────────────────────────────
PROJECT_NAME: str = config("PROJECT_NAME", default="Smart Travel Planner API")
VERSION: str = config("VERSION", default="0.2.0")
API_PREFIX: str = config("API_PREFIX", default="/api/v1")
DEBUG: bool = config("DEBUG", cast=bool, default=False)
PORT: int = config("PORT", cast=int, default=8000)

# ── Database (Supabase / PostgreSQL) ──────────────────────────────────────────
DATABASE_URL: str = config(
    "DATABASE_URL",
    default="postgresql://postgres:postgres@db:5432/app",
)

# ── Auth / JWT ────────────────────────────────────────────────────────────────
SECRET_KEY: str = config("SECRET_KEY", cast=str, default="change-me-in-production")
JWT_ALGORITHM: str = config("JWT_ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_DAYS: int = config("ACCESS_TOKEN_EXPIRE_DAYS", cast=int, default=7)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = list(
    config(
        "CORS_ORIGINS",
        cast=CommaSeparatedStrings,
        default="http://localhost:5173,http://localhost:3000",
    )
)

# ── External APIs ─────────────────────────────────────────────────────────────
OPENWEATHER_API_KEY: Secret = config("OPENWEATHER_API_KEY", cast=Secret, default="")
EXCHANGERATE_API_KEY: Secret = config("EXCHANGERATE_API_KEY", cast=Secret, default="")
UNSPLASH_ACCESS_KEY: Secret = config("UNSPLASH_ACCESS_KEY", cast=Secret, default="")
GOOGLE_API_KEY: Secret = config("GOOGLE_API_KEY", cast=Secret, default="")

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING_LEVEL = logging.DEBUG if DEBUG else logging.INFO
logging.basicConfig(
    handlers=[InterceptHandler(level=LOGGING_LEVEL)], level=LOGGING_LEVEL
)
logger.configure(handlers=[{"sink": sys.stderr, "level": LOGGING_LEVEL}])
