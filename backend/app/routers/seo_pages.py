"""Admin CRUD for standalone SEO landing pages (served at ``/{slug}``).

Slugs are validated against ``RESERVED_TOP_LEVEL_SLUGS`` in the schema so a
page can never shadow a real route. Public reads live in
:mod:`app.routers.public` (``/public/pages``) and only expose published pages.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import SeoPage
from app.schemas import SeoPageIn, SeoPageOut

router = APIRouter(prefix="/admin/seo-pages", tags=["admin", "seo-pages"])


def _to_out(row: SeoPage) -> SeoPageOut:
    return SeoPageOut(
        slug=row.slug,
        title=row.title,
        content_html=row.content_html,
        meta_title=row.meta_title,
        meta_description=row.meta_description,
        og_image_url=row.og_image_url,
        is_published=row.is_published,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _apply(row: SeoPage, payload: SeoPageIn) -> None:
    row.title = payload.title
    row.content_html = payload.content_html
    row.meta_title = payload.meta_title
    row.meta_description = payload.meta_description
    row.og_image_url = payload.og_image_url
    row.is_published = payload.is_published


@router.get("", response_model=list[SeoPageOut])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[SeoPageOut]:
    rows = await db.execute(select(SeoPage).order_by(SeoPage.updated_at.desc()))
    return [_to_out(row) for row in rows.scalars()]


@router.post("", response_model=SeoPageOut, status_code=status.HTTP_201_CREATED)
async def create(payload: SeoPageIn, current: CurrentAdmin, db: DbSession) -> SeoPageOut:
    if await db.get(SeoPage, payload.slug) is not None:
        raise ConflictError(f"SEO page '{payload.slug}' already exists.")
    row = SeoPage(slug=payload.slug)
    _apply(row, payload)
    db.add(row)
    await db.flush()
    await db.refresh(row)
    logger.info("seo_page_created", slug=payload.slug, by=str(current.id))
    return _to_out(row)


@router.get("/{slug}", response_model=SeoPageOut)
async def get_one(slug: str, _: CurrentAdmin, db: DbSession) -> SeoPageOut:
    row = await db.get(SeoPage, slug)
    if row is None:
        raise NotFoundError(f"SEO page '{slug}' not found.")
    return _to_out(row)


@router.put("/{slug}", response_model=SeoPageOut)
async def replace(
    slug: str, payload: SeoPageIn, current: CurrentAdmin, db: DbSession
) -> SeoPageOut:
    row = await db.get(SeoPage, slug)
    if row is None:
        raise NotFoundError(f"SEO page '{slug}' not found.")
    if payload.slug != slug:
        # Slug rename: move the row, preserving its creation timestamp.
        if await db.get(SeoPage, payload.slug) is not None:
            raise ConflictError(f"SEO page '{payload.slug}' already exists.")
        created_at = row.created_at
        await db.delete(row)
        await db.flush()
        row = SeoPage(slug=payload.slug, created_at=created_at)
        _apply(row, payload)
        db.add(row)
    else:
        _apply(row, payload)
    await db.flush()
    await db.refresh(row)
    logger.info("seo_page_updated", slug=payload.slug, by=str(current.id))
    return _to_out(row)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(slug: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(SeoPage, slug)
    if row is None:
        raise NotFoundError(f"SEO page '{slug}' not found.")
    await db.delete(row)
    logger.info("seo_page_deleted", slug=slug, by=str(current.id))
