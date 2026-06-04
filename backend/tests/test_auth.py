from httpx import AsyncClient

from app.models import AdminUser
from app.security import hash_password


async def test_login_and_me(client: AsyncClient, db) -> None:
    db.add(
        AdminUser(
            email="admin@example.com",
            name="Admin",
            password_hash=hash_password("correcthorse"),
        )
    )
    await db.commit()

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "correcthorse"},
    )
    assert r.status_code == 200, r.text
    tokens = r.json()["tokens"]
    assert tokens["token_type"] == "Bearer"

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "admin@example.com"


async def test_login_wrong_password(client: AsyncClient, db) -> None:
    db.add(
        AdminUser(
            email="admin2@example.com",
            name="Admin",
            password_hash=hash_password("correcthorse"),
        )
    )
    await db.commit()

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin2@example.com", "password": "wrongwrong"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"
