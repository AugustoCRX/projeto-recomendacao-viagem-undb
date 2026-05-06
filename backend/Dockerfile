# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for psycopg2 + bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps using the venv-less uv installer for speed
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install uv && \
    uv pip install --system -e .

ARG DEV=false
RUN if [ "$DEV" = "true" ]; then uv pip install --system -e ".[dev]"; fi

# Copy source — keep documentation.md alongside app/ so views/docs.py finds it
COPY ./app/ ./app/
COPY ./tests/ ./tests/
COPY ./documentation.md ./documentation.md

ENV PYTHONPATH=/app/app
# Stay at /app so pytest's `testpaths = ["tests"]` resolves correctly
# (pytest 9 only applies testpaths when invoked from rootdir).
WORKDIR /app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
