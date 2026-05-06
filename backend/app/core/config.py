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
# Regex matched against the Origin header. Useful for Vercel previews where
# every deploy gets a unique hash subdomain (e.g. project-abc123-team.vercel.app).
# Leave empty to disable.
CORS_ORIGIN_REGEX: str = config(
    "CORS_ORIGIN_REGEX",
    default=r"https://.*\.vercel\.app",
)

# ── External APIs ─────────────────────────────────────────────────────────────
OPENWEATHER_API_KEY: Secret = config("OPENWEATHER_API_KEY", cast=Secret, default="")
EXCHANGERATE_API_KEY: Secret = config("EXCHANGERATE_API_KEY", cast=Secret, default="")
UNSPLASH_ACCESS_KEY: Secret = config("UNSPLASH_ACCESS_KEY", cast=Secret, default="")
GOOGLE_API_KEY: Secret = config("GOOGLE_API_KEY", cast=Secret, default="")

# ── AI providers ──────────────────────────────────────────────────────────────
# Comma-separated priority order. The first provider with a key configured
# is used; on quota/availability errors the next one is tried. Valid: gemini,
# groq, openrouter. Order them by preference / cost.
AI_PROVIDERS: list[str] = list(
    config(
        "AI_PROVIDERS",
        cast=CommaSeparatedStrings,
        default="groq,openrouter,gemini",
    )
)

# Groq — https://console.groq.com (free tier: ~14k req/day, Llama 3.3 70B)
GROQ_API_KEY: Secret = config("GROQ_API_KEY", cast=Secret, default="")
GROQ_MODEL: str = config("GROQ_MODEL", default="llama-3.3-70b-versatile")
GROQ_FALLBACKS: list[str] = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
]

# OpenRouter — https://openrouter.ai (free models with `:free` suffix)
OPENROUTER_API_KEY: Secret = config("OPENROUTER_API_KEY", cast=Secret, default="")
OPENROUTER_MODEL: str = config(
    "OPENROUTER_MODEL", default="meta-llama/llama-3.3-70b-instruct:free"
)
OPENROUTER_FALLBACKS: list[str] = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "qwen/qwen-2.5-72b-instruct:free",
]

_GEMINI_DEFAULT = "gemini-2.0-flash"
# Ordered fallback chain — tried in sequence if the configured model fails at
# runtime (deprecated, blocked region, quota, etc.). Gemini API model names
# always start with "gemini-".
# Each model has an independent quota bucket on the free tier — so when one
# returns 429 RESOURCE_EXHAUSTED we can keep going. Order = preferred first.
GEMINI_FALLBACKS: list[str] = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
]


def _validate_gemini_model(name: str) -> str:
    """Reject obvious garbage (placeholders, env-var-named-as-value)."""
    name = (name or "").strip()
    if not name or not name.lower().startswith("gemini-"):
        # Use loguru lazily — it's already imported above.
        logger.warning(
            f"GEMINI_MODEL={name!r} is not a valid Gemini model name; "
            f"falling back to {_GEMINI_DEFAULT!r}"
        )
        return _GEMINI_DEFAULT
    return name


GEMINI_MODEL: str = _validate_gemini_model(
    config("GEMINI_MODEL", default=_GEMINI_DEFAULT)
)

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING_LEVEL = logging.DEBUG if DEBUG else logging.INFO
logging.basicConfig(
    handlers=[InterceptHandler(level=LOGGING_LEVEL)], level=LOGGING_LEVEL
)
logger.configure(handlers=[{"sink": sys.stderr, "level": LOGGING_LEVEL}])