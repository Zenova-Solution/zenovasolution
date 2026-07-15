"""Tests for admin SEO-page CRUD + public page read endpoints.

SEO pages are served at top-level URLs (``/{slug}``), so reserved slugs
(existing routes, portal prefixes, the ``new`` editor sentinel) must be
rejected at validation time.
"""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminUser, SeoPage
from app.security import hash_password

ADMIN_PAGES = "/api/v1/admin/seo-pages"
PUBLIC_PAGES = "/api/v1/public/pages"
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


def page_payload(slug: str, **overrides: object) -> dict:
    payload: dict = {
        "slug": slug,
        "title": f"Page {slug}",
        "content_html": f"<p>Content of {slug}</p>",
        "is_published": False,
    }
    payload.update(overrides)
    return payload


async def make_page(db: AsyncSession, slug: str, *, is_published: bool = True) -> SeoPage:
    page = SeoPage(
        slug=slug,
        title=f"Page {slug}",
        content_html=f"<p>Content of {slug}</p>",
        is_published=is_published,
    )
    db.add(page)
    await db.commit()
    return page


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------


async def test_seo_pages_requires_auth(client: AsyncClient) -> None:
    assert (await client.get(ADMIN_PAGES)).status_code == 401
    assert (await client.post(ADMIN_PAGES, json=page_payload("x"))).status_code == 401


async def test_seo_pages_rbac_forbidden(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-team@example.com", role="team")
    await make_user(db, "seo-client@example.com", role="client")
    for email in ("seo-team@example.com", "seo-client@example.com"):
        token = await token_for(client, email)
        assert (await client.get(ADMIN_PAGES, headers=auth(token))).status_code == 403
        r = await client.post(ADMIN_PAGES, json=page_payload("rbac-page"), headers=auth(token))
        assert r.status_code == 403
        assert (
            await client.delete(f"{ADMIN_PAGES}/rbac-page", headers=auth(token))
        ).status_code == 403


async def test_seo_page_create_and_get(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin1@example.com")
    token = await token_for(client, "seo-admin1@example.com")

    r = await client.post(ADMIN_PAGES, json=page_payload("landing-one"), headers=auth(token))
    assert r.status_code == 201, r.text
    assert r.json()["slug"] == "landing-one"
    assert r.json()["is_published"] is False

    r = await client.get(f"{ADMIN_PAGES}/landing-one", headers=auth(token))
    assert r.status_code == 200
    assert r.json()["content_html"] == "<p>Content of landing-one</p>"


async def test_seo_page_duplicate_conflict(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin2@example.com")
    token = await token_for(client, "seo-admin2@example.com")
    assert (
        await client.post(ADMIN_PAGES, json=page_payload("dup-page"), headers=auth(token))
    ).status_code == 201
    assert (
        await client.post(ADMIN_PAGES, json=page_payload("dup-page"), headers=auth(token))
    ).status_code == 409


async def test_seo_page_reserved_slugs_rejected(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin3@example.com")
    token = await token_for(client, "seo-admin3@example.com")
    for slug in ("pricing", "admin", "new", "blog", "terms"):
        r = await client.post(ADMIN_PAGES, json=page_payload(slug), headers=auth(token))
        assert r.status_code == 422, f"slug '{slug}' should be rejected: {r.text}"


async def test_seo_page_rename_moves_row(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin4@example.com")
    token = await token_for(client, "seo-admin4@example.com")

    r = await client.post(ADMIN_PAGES, json=page_payload("page-old"), headers=auth(token))
    assert r.status_code == 201
    created_at = r.json()["created_at"]

    r = await client.put(
        f"{ADMIN_PAGES}/page-old", json=page_payload("page-new"), headers=auth(token)
    )
    assert r.status_code == 200, r.text
    assert r.json()["slug"] == "page-new"
    assert r.json()["created_at"] == created_at

    assert (await client.get(f"{ADMIN_PAGES}/page-old", headers=auth(token))).status_code == 404
    assert (await client.get(f"{ADMIN_PAGES}/page-new", headers=auth(token))).status_code == 200


async def test_seo_page_rename_conflict(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin5@example.com")
    token = await token_for(client, "seo-admin5@example.com")
    for slug in ("page-clash-a", "page-clash-b"):
        assert (
            await client.post(ADMIN_PAGES, json=page_payload(slug), headers=auth(token))
        ).status_code == 201
    r = await client.put(
        f"{ADMIN_PAGES}/page-clash-a", json=page_payload("page-clash-b"), headers=auth(token)
    )
    assert r.status_code == 409


async def test_seo_page_delete(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, "seo-admin6@example.com")
    token = await token_for(client, "seo-admin6@example.com")
    assert (
        await client.post(ADMIN_PAGES, json=page_payload("gone-page"), headers=auth(token))
    ).status_code == 201
    assert (
        await client.delete(f"{ADMIN_PAGES}/gone-page", headers=auth(token))
    ).status_code == 204
    assert (
        await client.delete(f"{ADMIN_PAGES}/gone-page", headers=auth(token))
    ).status_code == 404
    assert (
        await db.execute(select(SeoPage).where(SeoPage.slug == "gone-page"))
    ).scalar_one_or_none() is None


# ---------------------------------------------------------------------------
# Public reads
# ---------------------------------------------------------------------------


async def test_public_pages_lists_only_published(client: AsyncClient, db: AsyncSession) -> None:
    await make_page(db, "pub-page-live")
    await make_page(db, "pub-page-hidden", is_published=False)

    r = await client.get(PUBLIC_PAGES)
    assert r.status_code == 200, r.text
    slugs = [item["slug"] for item in r.json()]
    assert "pub-page-live" in slugs
    assert "pub-page-hidden" not in slugs
    # Listing payload has no body HTML.
    assert all("content_html" not in item for item in r.json())


async def test_public_page_detail(client: AsyncClient, db: AsyncSession) -> None:
    await make_page(db, "pub-detail-page")
    r = await client.get(f"{PUBLIC_PAGES}/pub-detail-page")
    assert r.status_code == 200, r.text
    assert r.json()["content_html"] == "<p>Content of pub-detail-page</p>"


async def test_public_page_detail_hides_unpublished(
    client: AsyncClient, db: AsyncSession
) -> None:
    await make_page(db, "pub-hidden-page", is_published=False)
    assert (await client.get(f"{PUBLIC_PAGES}/pub-hidden-page")).status_code == 404
    assert (await client.get(f"{PUBLIC_PAGES}/never-existed")).status_code == 404
