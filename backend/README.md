# Smart Travel Planner — Backend

FastAPI backend in **MVT** layout (Models / Views / Templates a.k.a. Schemas),
backed by PostgreSQL (Supabase in cloud, vanilla Postgres locally). Deployable
as a single Docker image on Render or any container host.


## 🌐 Live deployment (Render)

Base URL: **<https://smart-travel-planner-api-4sx8.onrender.com>**

| Recurso | URL |
|---------|-----|
| Swagger UI (OpenAPI interativo) | <https://smart-travel-planner-api-4sx8.onrender.com/docs> |
| ReDoc | <https://smart-travel-planner-api-4sx8.onrender.com/redoc> |
| Documentação + diagramas Mermaid (HTML) | <https://smart-travel-planner-api-4sx8.onrender.com/api/v1/docs-md> |
| Documentação em markdown bruto (JSON) | <https://smart-travel-planner-api-4sx8.onrender.com/api/v1/docs-md/raw> |
| Health probe | <https://smart-travel-planner-api-4sx8.onrender.com/health> |
| OpenAPI schema | <https://smart-travel-planner-api-4sx8.onrender.com/openapi.json> |

> O plano free do Render dorme após 15 min de inatividade — o primeiro request
> pode levar ~30 s para acordar.

> Full developer guide with diagrams: `GET /api/v1/docs-md`
> (or read [`documentation.md`](./documentation.md) directly).

## Quick start (Docker, recommended)

```bash
cp .env.example .env       # adjust SECRET_KEY + API keys
docker compose up --build  # API at http://localhost:8000
```

The Postgres container auto-applies [`../db/schema.sql`](../db/schema.sql) on
first boot. Visit:

- `http://localhost:8000/docs` — Swagger UI
- `http://localhost:8000/api/v1/docs-md` — project docs (with Mermaid diagrams)
- `http://localhost:8000/health` — liveness probe

## Quick start (local Python)

```bash
python -m venv .venv && source .venv/bin/activate
pip install uv && uv pip install -e ".[dev]"
export PYTHONPATH=$PWD/app
uvicorn app.main:app --reload --port 8000
```

## Layout

```
backend/
├── app/
│   ├── main.py            FastAPI factory, CORS, JWT middleware, /health
│   ├── urls.py            single router mount point
│   ├── db.py              SQLAlchemy engine + SessionLocal + Base
│   ├── deps.py            get_db, get_current_user
│   ├── core/              config, security, errors, events, logging
│   ├── middleware/        jwt_middleware
│   ├── models/            [M] SQLAlchemy ORM
│   ├── schemas/           [T] Pydantic v2 DTOs
│   ├── views/             [V] FastAPI routers + business logic
│   ├── services/          external API clients + TTL cache
│   └── ai/                LangGraph travel-plan agent
├── documentation.md       served at /api/v1/docs-md
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── .env.example
```

## Tests

`pytest` is the test runner; FastAPI's `TestClient` (built on `httpx`) drives the
HTTP layer. Tests live under `backend/tests/`.

### Run inside Docker (recommended — matches CI)

```bash
docker compose run --rm app pytest -vv
# only one file
docker compose run --rm app pytest tests/test_auth.py -vv
# with coverage
docker compose run --rm app pytest --cov=. --cov-report=term-missing
```

### Run locally

```bash
pip install uv && uv pip install -e ".[dev]"
export PYTHONPATH=$PWD/app
# minimal env to satisfy core/config at import time
export SECRET_KEY=test-secret DATABASE_URL=sqlite:///./_test.db
pytest -vv
```

### Or via the Makefile

```bash
make test     # installs deps + runs pytest tests -vv
```

### Writing tests

Use `TestClient(app)` and override `deps.get_db` to inject an in-memory SQLite
session so suites are hermetic:

```python
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from db import Base
from deps import get_db

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

def _override_db():
    db = TestSession()
    try: yield db
    finally: db.close()

app.dependency_overrides[get_db] = _override_db
client = TestClient(app)

def test_register_then_login():
    r = client.post("/api/v1/auth/register",
                    json={"name":"Ana","email":"a@x.com","password":"pass1234"})
    assert r.status_code == 201
    token = r.json()["token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
```

> Note: the legacy `tests/test_*` files target the removed ML predictor and
> should be deleted/rewritten against the new MVT views as features land.

## Environment

All config lives in `.env` (never committed). See `.env.example` for the full
list and how to obtain free-tier API keys.

## Architecture principles

- **Modular monolith** — one deployable unit, organized by feature folders.
- **SOLID** — views depend on schemas + services (abstractions), not on each other.
  Swapping the AI provider only touches `ai/nodes.py`; swapping the weather
  provider only touches `services/weather.py`.
- **Cloud-native** — stateless API, in-memory cache OK to lose, all state in
  Postgres, secrets via env vars.

## Cloud deploy (Render + Supabase)

1. Create a Supabase project and copy the pooler `DATABASE_URL`.
2. Run `psql "$DATABASE_URL" -f db/schema.sql` once.
3. On Render → New Web Service → Docker → root `backend/`. Health path `/health`.
4. Paste env vars from `.env.example` into Render dashboard.
5. Point your frontend `VITE_BACKEND_URL` to the new Render URL.
