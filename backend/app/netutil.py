"""Networking helpers shared by request logging and rate limiting."""

from __future__ import annotations

from starlette.requests import Request


def client_ip(request: Request, *, trusted_proxy_count: int = 1) -> str:
    """Best-effort originating client IP.

    Uses ``X-Forwarded-For`` when the app sits behind a proxy (e.g. Render's
    load balancer), where the socket peer is the proxy. The right-most entries
    are the proxies closest to the application and therefore trustworthy; the
    entry immediately to their left is the first untrusted hop — the real
    client. Falls back to the socket peer when no forwarded header is present.

    ``trusted_proxy_count`` defaults to 1. Increase it if you have more proxy
    layers between the internet and the app.

    Both the access log and the rate limiter key on this, so they stay
    consistent: a throttled IP is the same IP that shows up in the logs.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            # Pick the entry that is `trusted_proxy_count` hops from the right.
            idx = max(0, len(parts) - 1 - trusted_proxy_count)
            return parts[idx]
    return request.client.host if request.client else "-"
