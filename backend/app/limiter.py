"""Shared slowapi limiter so routers can apply per-endpoint limits."""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings


def _key(request) -> str:  # type: ignore[no-untyped-def]
    return get_remote_address(request)


_settings = get_settings()
limiter = Limiter(
    key_func=_key,
    default_limits=[_settings.rate_limit_default],
    headers_enabled=True,
)
