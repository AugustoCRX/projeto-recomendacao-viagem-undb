"""
middleware/jwt_middleware.py
────────────────────────────
Starlette BaseHTTPMiddleware that validates JWT tokens before any route handler
runs. Acts as a fast-reject guard — invalid tokens are rejected immediately
without touching the database.

Flow:
  Request → JWTMiddleware (token check) → Route → Depends(get_current_user)

Public paths bypass the check entirely. All other paths require a valid
``Authorization: Bearer <token>`` header.

On success the decoded ``user_id`` (sub claim) is stored in
``request.state.user_id`` so downstream dependencies can read it without
re-decoding the token.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from core.security import verify_token

# Paths that do NOT require authentication
PUBLIC_PATHS: frozenset[str] = frozenset(
    {
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/external/weather",
        "/api/v1/external/places",
        "/api/v1/external/country",
        "/api/v1/external/exchange",
        "/api/v1/external/images",
        "/api/v1/docs-md",
        "/api/v1/docs-md/raw",
        # FastAPI built-in docs
        "/docs",
        "/redoc",
        "/openapi.json",
        # health check
        "/health",
    }
)


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # CORS preflight requests never carry Authorization — must pass through
        # so the CORSMiddleware downstream can answer with the right headers.
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Allow public routes through without a token
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                {"detail": "Not authenticated. Provide Authorization: Bearer <token>"},
                status_code=401,
            )

        token = auth_header[len("Bearer "):]
        try:
            payload = verify_token(token)
            request.state.user_id = payload["sub"]
        except Exception:
            return JSONResponse(
                {"detail": "Invalid or expired token"},
                status_code=401,
            )

        return await call_next(request)
