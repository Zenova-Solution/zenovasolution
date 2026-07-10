"""Tests for the admin user-management endpoints (/api/v1/admin/users).

The schema fixture is session-scoped with no truncation between tests, so
every test uses its own unique emails.
"""

import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminUser
from app.security import hash_password

BASE = "/api/v1/admin/users"
PASSWORD = "correcthorse"  # noqa: S105 -- test credential


async def make_user(
    db: AsyncSession,
    email: str,
    role: str = "admin",
    password: str = PASSWORD,
    *,
    is_active: bool = True,
) -> AdminUser:
    user = AdminUser(
        email=email,
        name=email.split("@")[0].title(),
        role=role,
        password_hash=hash_password(password),
        is_active=is_active,
    )
    db.add(user)
    await db.commit()
    return user


async def token_for(client: AsyncClient, email: str, password: str = PASSWORD) -> str:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["tokens"]["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_users_requires_auth(client: AsyncClient) -> None:
    r = await client.get(BASE)
    assert r.status_code == 401


async def test_users_rbac_forbidden(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "rbac-team@example.com", role="team")
    await make_user(db, "rbac-client@example.com", role="client")

    for email in ("rbac-team@example.com", "rbac-client@example.com"):
        token = await token_for(client, email)
        some_id = str(uuid.uuid4())
        for method, path, kwargs in (
            ("GET", BASE, {}),
            (
                "POST",
                BASE,
                {"json": {"email": "x@example.com", "name": "X", "password": PASSWORD}},
            ),
            ("PATCH", f"{BASE}/{some_id}", {"json": {"name": "X"}}),
            ("DELETE", f"{BASE}/{some_id}", {}),
        ):
            r = await client.request(method, path, headers=auth(token), **kwargs)
            assert r.status_code == 403, f"{method} {path} as {email}: {r.text}"
            assert r.json()["error"]["code"] == "forbidden"


async def test_admin_crud_happy_path(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "crud-admin@example.com", role="admin")
    token = await token_for(client, "crud-admin@example.com")

    # Create — email is lowercased, secrets never leave the API.
    r = await client.post(
        BASE,
        headers=auth(token),
        json={
            "email": "CRUD-Client@Example.com",
            "name": "Crud Client",
            "role": "client",
            "password": "clientpass1",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["email"] == "crud-client@example.com"
    assert body["role"] == "client"
    assert body["is_active"] is True
    assert "password" not in body
    assert "password_hash" not in body
    created_id = body["id"]

    # List contains the new user.
    r = await client.get(BASE, headers=auth(token))
    assert r.status_code == 200
    assert created_id in [u["id"] for u in r.json()]

    # Patch name / role / is_active.
    r = await client.patch(
        f"{BASE}/{created_id}",
        headers=auth(token),
        json={"name": "Renamed", "role": "team", "is_active": False},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["name"] == "Renamed"
    assert body["role"] == "team"
    assert body["is_active"] is False

    # Delete.
    r = await client.delete(f"{BASE}/{created_id}", headers=auth(token))
    assert r.status_code == 204

    r = await client.get(BASE, headers=auth(token))
    assert created_id not in [u["id"] for u in r.json()]


async def test_create_duplicate_email_conflict(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "dup-admin@example.com", role="admin")
    token = await token_for(client, "dup-admin@example.com")

    payload = {"email": "dup-user@example.com", "name": "Dup", "password": PASSWORD}
    r = await client.post(BASE, headers=auth(token), json=payload)
    assert r.status_code == 201, r.text

    # Same address in different case is still a duplicate.
    r = await client.post(
        BASE, headers=auth(token), json={**payload, "email": "Dup-User@Example.com"}
    )
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "conflict"


async def test_password_reset_changes_login(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "reset-admin@example.com", role="admin")
    target = await make_user(
        db, "reset-target@example.com", role="client", password="oldpass123"  # noqa: S106
    )
    token = await token_for(client, "reset-admin@example.com")

    r = await client.patch(
        f"{BASE}/{target.id}", headers=auth(token), json={"password": "newpass123"}
    )
    assert r.status_code == 200, r.text

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset-target@example.com", "password": "oldpass123"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset-target@example.com", "password": "newpass123"},
    )
    assert r.status_code == 200, r.text


async def test_self_rails(client: AsyncClient, db: AsyncSession) -> None:
    me = await make_user(db, "rails-admin@example.com", role="admin")
    token = await token_for(client, "rails-admin@example.com")

    r = await client.patch(f"{BASE}/{me.id}", headers=auth(token), json={"role": "team"})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "forbidden"

    r = await client.patch(f"{BASE}/{me.id}", headers=auth(token), json={"is_active": False})
    assert r.status_code == 403

    r = await client.delete(f"{BASE}/{me.id}", headers=auth(token))
    assert r.status_code == 403

    # Editing your own name (and password) stays allowed.
    r = await client.patch(f"{BASE}/{me.id}", headers=auth(token), json={"name": "Still Me"})
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Still Me"


async def test_deactivated_user_locked_out(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "lock-admin@example.com", role="admin")
    target = await make_user(db, "lock-target@example.com", role="team")
    admin_token = await token_for(client, "lock-admin@example.com")
    target_token = await token_for(client, "lock-target@example.com")

    r = await client.patch(
        f"{BASE}/{target.id}", headers=auth(admin_token), json={"is_active": False}
    )
    assert r.status_code == 200, r.text

    # Existing access token is rejected on the next request...
    r = await client.get("/api/v1/auth/me", headers=auth(target_token))
    assert r.status_code == 401

    # ...and a fresh login fails too.
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "lock-target@example.com", "password": PASSWORD},
    )
    assert r.status_code == 401


async def test_unknown_and_malformed_ids(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "ids-admin@example.com", role="admin")
    token = await token_for(client, "ids-admin@example.com")

    missing = str(uuid.uuid4())
    r = await client.patch(f"{BASE}/{missing}", headers=auth(token), json={"name": "X"})
    assert r.status_code == 404
    r = await client.delete(f"{BASE}/{missing}", headers=auth(token))
    assert r.status_code == 404

    r = await client.patch(f"{BASE}/not-a-uuid", headers=auth(token), json={"name": "X"})
    assert r.status_code == 422


async def test_patch_email_conflict(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "email-admin@example.com", role="admin")
    await make_user(db, "email-taken@example.com", role="client")
    target = await make_user(db, "email-target@example.com", role="client")
    token = await token_for(client, "email-admin@example.com")

    r = await client.patch(
        f"{BASE}/{target.id}", headers=auth(token), json={"email": "Email-Taken@example.com"}
    )
    assert r.status_code == 409

    # Re-sending your current email in a different case is a no-op, not a conflict.
    r = await client.patch(
        f"{BASE}/{target.id}", headers=auth(token), json={"email": "EMAIL-target@example.com"}
    )
    assert r.status_code == 200, r.text
    assert r.json()["email"] == "email-target@example.com"
