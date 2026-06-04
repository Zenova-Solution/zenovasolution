from httpx import AsyncClient


async def test_health(client: AsyncClient) -> None:
    r = await client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body


async def test_unknown_route_shape(client: AsyncClient) -> None:
    r = await client.get("/api/v1/admin/services")
    assert r.status_code == 401
    body = r.json()
    assert body["error"]["code"] == "unauthorized"
