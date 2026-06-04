"""Password hashing + JWT issuance/verification."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import base64
import hashlib

import jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.errors import AuthError

_pwd: CryptContext | None = None

TokenType = Literal["access", "refresh"]


def _pwd_ctx() -> CryptContext:
    global _pwd

    if _pwd is None:
        settings = get_settings()

        _pwd = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=settings.bcrypt_rounds,
        )

    return _pwd


def _normalize_password(password: str) -> str:
    """
    bcrypt only supports 72 bytes.

    For longer passwords:
    - SHA256 hash
    - Base64 encode
    """

    password_bytes = password.encode("utf-8")

    if len(password_bytes) <= 72:
        return password

    digest = hashlib.sha256(password_bytes).digest()
    return base64.b64encode(digest).decode("utf-8")


def hash_password(password: str) -> str:
    password = _normalize_password(password)
    return _pwd_ctx().hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        password = _normalize_password(password)
        return _pwd_ctx().verify(password, password_hash)

    except ValueError:
        # Malformed hash should never authenticate
        return False


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def issue_token(
    subject: str,
    kind: TokenType = "access",
    **extra: Any,
) -> tuple[str, int]:
    """Return (token, expires_in_seconds)."""

    settings = get_settings()

    if kind == "access":
        delta = timedelta(minutes=settings.jwt_access_ttl_minutes)
    else:
        delta = timedelta(days=settings.jwt_refresh_ttl_days)

    now = _now()
    exp = now + delta

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": kind,
        **extra,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    return token, int(delta.total_seconds())


def decode_token(
    token: str,
    *,
    expected_type: TokenType | None = None,
) -> dict[str, Any]:
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "type"]},
        )

    except jwt.ExpiredSignatureError as e:
        raise AuthError(
            "Token has expired.",
            code="token_expired",
        ) from e

    except jwt.InvalidTokenError as e:
        raise AuthError(
            "Invalid token.",
            code="invalid_token",
        ) from e

    if expected_type and payload.get("type") != expected_type:
        raise AuthError(
            "Wrong token type.",
            code="invalid_token",
        )

    return payload