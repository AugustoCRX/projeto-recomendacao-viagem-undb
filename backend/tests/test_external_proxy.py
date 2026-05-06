"""
tests/test_external_proxy.py — TC-18..TC-21 + TC-25

External-API proxy & cache + the docs-md route. All HTTP calls are stubbed by
monkeypatching ``httpx.AsyncClient`` — no network access is performed.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock

import pytest

from services import cache as svc_cache


# ── Helpers ───────────────────────────────────────────────────────────────────
class _Resp:
    def __init__(self, status_code: int = 200, json_data: Any | None = None):
        self.status_code = status_code
        self._json = json_data or {}

    def json(self):
        return self._json


class _FakeClient:
    """Drop-in replacement for ``httpx.AsyncClient`` that records calls."""

    def __init__(self, get_responses=None, post_responses=None):
        self._get = list(get_responses or [])
        self._post = list(post_responses or [])
        self.get_calls: list[tuple[str, dict]] = []
        self.post_calls: list[tuple[str, dict]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, params=None, headers=None):
        self.get_calls.append((url, params or {}))
        if not self._get:
            return _Resp(200, {})
        return self._get.pop(0)

    async def post(self, url, data=None, params=None, headers=None):
        self.post_calls.append((url, data or {}))
        if not self._post:
            return _Resp(200, {})
        return self._post.pop(0)


@pytest.fixture(autouse=True)
def _clear_cache():
    svc_cache.clear()
    yield
    svc_cache.clear()


# ── TC-18 ─────────────────────────────────────────────────────────────────────
def test_tc18_weather_upstream_failure(client, monkeypatch):
    import httpx

    import services.weather as w

    # Force OWM key to be set so we don't hit the 503 early-return
    monkeypatch.setattr(w, "OPENWEATHER_API_KEY", "fake-key")

    def _raise(*a, **kw):
        raise httpx.HTTPError("boom")

    fake = _FakeClient()
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **kw: fake)
    monkeypatch.setattr(fake, "get", _raise)

    r = client.get("/api/v1/external/weather?city=Lisbon")
    assert r.status_code == 502
    assert "detail" in r.json()


def test_tc18_weather_no_api_key(client):
    # default fixture env has empty OPENWEATHER_API_KEY → graceful 503
    r = client.get("/api/v1/external/weather?city=Lisbon")
    assert r.status_code == 503


# ── TC-19 ─────────────────────────────────────────────────────────────────────
@pytest.mark.anyio
async def test_tc19_cache_avoids_second_upstream_call(monkeypatch):
    import httpx

    import services.weather as w

    monkeypatch.setattr(w, "OPENWEATHER_API_KEY", "fake-key")

    fake = _FakeClient(
        get_responses=[
            _Resp(200, {"current": True}),
            _Resp(200, {"forecast": True}),
        ]
    )
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **kw: fake)

    out1 = await w.get_weather("Porto")
    assert out1["current"] == {"current": True}
    first_call_count = len(fake.get_calls)

    out2 = await w.get_weather("Porto")
    assert out2 == out1
    # cache hit → no additional upstream calls
    assert len(fake.get_calls) == first_call_count


# ── TC-20 ─────────────────────────────────────────────────────────────────────
@pytest.mark.anyio
async def test_tc20_currency_conversion_math(monkeypatch):
    import httpx

    import services.exchange as ex

    # Use the no-key fallback path
    monkeypatch.setattr(ex, "EXCHANGERATE_API_KEY", "")
    fake = _FakeClient(
        get_responses=[_Resp(200, {"rates": {"BRL": 5.25}})]
    )
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **kw: fake)

    out = await ex.convert("USD", "BRL", 100)
    assert out["rate"] == 5.25
    assert out["converted"] == round(100 * 5.25, 2)
    assert out["base"] == "USD" and out["target"] == "BRL"


# ── TC-21 ─────────────────────────────────────────────────────────────────────
@pytest.mark.anyio
async def test_tc21_unsplash_forwards_params(monkeypatch):
    import httpx

    import services.images as im

    monkeypatch.setattr(im, "UNSPLASH_ACCESS_KEY", "demo-key")

    fake = _FakeClient(get_responses=[_Resp(200, {"total": 0, "results": []})])
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **kw: fake)

    await im.search_images("Lisbon", per_page=15)
    assert fake.get_calls, "upstream was not called"
    url, params = fake.get_calls[0]
    assert "unsplash" in url
    assert params.get("query") == "Lisbon"
    assert params.get("per_page") == 15


# ── TC-25 ─────────────────────────────────────────────────────────────────────
def test_tc25_docs_md_returns_html(client):
    r = client.get("/api/v1/docs-md")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    body = r.text
    assert "<html" in body
    # Mermaid bootstrap is part of the HTML shell
    assert "mermaid" in body.lower()


def test_tc25_docs_md_raw_returns_markdown(client):
    r = client.get("/api/v1/docs-md/raw")
    assert r.status_code == 200
    assert "markdown" in r.json()
    assert r.json()["markdown"].startswith("# Smart Travel Planner")


# ── async backend selection for pytest.mark.anyio ─────────────────────────────
@pytest.fixture
def anyio_backend():
    return "asyncio"
