"""FastAPI dependencies — DB session + RBAC.

There is one source of truth for "who is calling this endpoint":
:func:`get_current_user`. It decodes the access token and loads the matching
row from ``admin_users``. Role gates are thin wrappers that call it and then
check the ``role`` field.

Use ``CurrentAdmin`` on existing admin-only routes (services, projects, team
listings, content, brand, media). New role-aware routes pick the matching
``RequireAdmin`` / ``RequireTeam`` / ``RequireClient`` annotation, or use
:func:`require_any_role` for routes that accept more than one role.
"""

from __future__ import annotations

import uuid
from typing import Annotated

import structlog
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.errors import AuthError, ForbiddenError
from app.models import AdminUser
from app.security import decode_token

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> AdminUser:
    """Decode the bearer token and load the user. Role-agnostic."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError("Missing or malformed Authorization header.", code="unauthorized")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token, expected_type="access")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as e:
        raise AuthError("Invalid token subject.", code="invalid_token") from e

    user = await db.get(AdminUser, user_id)
    if user is None or not user.is_active:
        raise AuthError("Account is not active.", code="forbidden")

    # Bind user identity to the request's structured log context.
    structlog.contextvars.bind_contextvars(user_id=str(user.id), role=user.role)
    return user


def require_any_role(*allowed: str):
    """Build a dependency that lets only the given roles through.

    Example:
        ``RequireTeamOrAdmin = Annotated[AdminUser, Depends(require_any_role("team", "admin"))]``
    """

    async def _gate(user: Annotated[AdminUser, Depends(get_current_user)]) -> AdminUser:
        if user.role not in allowed:
            # 403, not 401: the token is valid — the role just isn't allowed.
            # A 401 here would trigger the frontend's pointless token refresh.
            raise ForbiddenError(f"This endpoint requires one of: {', '.join(allowed)}.")
        return user

    return _gate


# Convenience aliases for the common gates.
CurrentUser = Annotated[AdminUser, Depends(get_current_user)]
RequireAdmin = Annotated[AdminUser, Depends(require_any_role("admin"))]
RequireTeam = Annotated[AdminUser, Depends(require_any_role("team", "admin"))]
RequireClient = Annotated[AdminUser, Depends(require_any_role("client", "admin"))]

# Back-compat alias so the rest of the codebase (services, projects, content
# routers, etc.) keeps using the existing ``CurrentAdmin`` name.
CurrentAdmin = RequireAdmin


# Re-exported for callers that still import the legacy name.
get_current_admin = require_any_role("admin")
