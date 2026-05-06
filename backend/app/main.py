"""
main.py
───────
FastAPI app factory. Wires up:
  * CORS (origins from env)
  * JWT middleware (fast-reject before route dispatch)
  * URL routing (single mount of ``urls.router`` under ``API_PREFIX``)
  * Startup hook (DB schema ensure)
  * Health probe at ``/health`` for load balancers / Render health checks
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.events import create_start_app_handler
from middleware.jwt_middleware import JWTMiddleware
from urls import router as api_router

from core.config import (
    API_PREFIX, CORS_ORIGIN_REGEX, CORS_ORIGINS,
    DEBUG, PROJECT_NAME, VERSION,
)


def get_application() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # startup: ensure DB schema (idempotent create_all)
        create_start_app_handler(app)()
        yield
        # shutdown: nothing to do — engine is process-local

    application = FastAPI(
        title=PROJECT_NAME,
        debug=DEBUG,
        version=VERSION,
        description=(
            "Smart Travel Planner — FastAPI backend (MVT layout). "
            "See `/api/v1/docs-md` for the full developer guide with diagrams."
        ),
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_origin_regex=CORS_ORIGIN_REGEX or None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(JWTMiddleware)

    application.include_router(api_router, prefix=API_PREFIX)

    @application.get("/health", tags=["Meta"], summary="Liveness probe")
    def health() -> dict:
        return {"status": "ok", "service": PROJECT_NAME, "version": VERSION}

    return application


app = get_application()
