"""
services/cache.py
─────────────────
Tiny process-local TTL cache.

Used by the external-API services to avoid hammering free-tier providers
(OpenWeatherMap 60 req/min, Unsplash 50 req/h, etc.). The cache is in-memory
per worker — a multi-worker deployment will warm caches independently, which
is fine for this app's traffic profile.
"""

from __future__ import annotations

import time
from threading import Lock
from typing import Any, Optional

_store: dict[str, tuple[Any, float]] = {}
_lock = Lock()


def get(key: str) -> Optional[Any]:
    with _lock:
        item = _store.get(key)
        if not item:
            return None
        data, expires_at = item
        if expires_at < time.time():
            _store.pop(key, None)
            return None
        return data


def set(key: str, value: Any, ttl_seconds: int) -> None:  # noqa: A001
    with _lock:
        _store[key] = (value, time.time() + ttl_seconds)


def clear() -> None:
    with _lock:
        _store.clear()
