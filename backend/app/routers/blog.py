"""Admin CRUD for blog posts.

Public reads live in :mod:`app.routers.public` (``/public/blog``) and only
expose published posts; this router is the full admin surface incl. drafts.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, status
from sqlalchemy import select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import BlogPost
from app.schemas import BlogPostIn, BlogPostOut

router = APIRouter(prefix="/admin/blog", tags=["admin", "blog"])


def _to_out(row: BlogPost) -> BlogPostOut:
    return BlogPostOut(
        slug=row.slug,
        title=row.title,
        excerpt=row.excerpt,
        content_html=row.content_html,
        cover_image_url=row.cover_image_url,
        author_name=row.author_name,
        tags=row.tags,
        status=row.status,
        published_at=row.published_at,
        meta_title=row.meta_title,
        meta_description=row.meta_description,
        og_image_url=row.og_image_url,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _published_at_for(payload: BlogPostIn) -> datetime | None:
    """First publish without an explicit date stamps the post with now()."""
    if payload.status == "published" and payload.published_at is None:
        return datetime.now(UTC)
    return payload.published_at


def _apply(row: BlogPost, payload: BlogPostIn) -> None:
    row.title = payload.title
    row.excerpt = payload.excerpt
    row.content_html = payload.content_html
    row.cover_image_url = payload.cover_image_url
    row.author_name = payload.author_name
    row.tags = payload.tags
    row.status = payload.status
    row.published_at = _published_at_for(payload)
    row.meta_title = payload.meta_title
    row.meta_description = payload.meta_description
    row.og_image_url = payload.og_image_url


@router.get("", response_model=list[BlogPostOut])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[BlogPostOut]:
    rows = await db.execute(select(BlogPost).order_by(BlogPost.updated_at.desc()))
    return [_to_out(row) for row in rows.scalars()]


@router.post("", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED)
async def create(payload: BlogPostIn, current: CurrentAdmin, db: DbSession) -> BlogPostOut:
    if await db.get(BlogPost, payload.slug) is not None:
        raise ConflictError(f"Blog post '{payload.slug}' already exists.")
    row = BlogPost(slug=payload.slug)
    _apply(row, payload)
    db.add(row)
    await db.flush()
    await db.refresh(row)
    logger.info("blog_post_created", slug=payload.slug, by=str(current.id))
    return _to_out(row)


@router.get("/{slug}", response_model=BlogPostOut)
async def get_one(slug: str, _: CurrentAdmin, db: DbSession) -> BlogPostOut:
    row = await db.get(BlogPost, slug)
    if row is None:
        raise NotFoundError(f"Blog post '{slug}' not found.")
    return _to_out(row)


@router.put("/{slug}", response_model=BlogPostOut)
async def replace(
    slug: str, payload: BlogPostIn, current: CurrentAdmin, db: DbSession
) -> BlogPostOut:
    row = await db.get(BlogPost, slug)
    if row is None:
        raise NotFoundError(f"Blog post '{slug}' not found.")
    if payload.slug != slug:
        # Slug rename: move the row, preserving its creation timestamp.
        if await db.get(BlogPost, payload.slug) is not None:
            raise ConflictError(f"Blog post '{payload.slug}' already exists.")
        created_at = row.created_at
        await db.delete(row)
        await db.flush()
        row = BlogPost(slug=payload.slug, created_at=created_at)
        _apply(row, payload)
        db.add(row)
    else:
        _apply(row, payload)
    await db.flush()
    await db.refresh(row)
    logger.info("blog_post_updated", slug=payload.slug, by=str(current.id))
    return _to_out(row)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(slug: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(BlogPost, slug)
    if row is None:
        raise NotFoundError(f"Blog post '{slug}' not found.")
    await db.delete(row)
    logger.info("blog_post_deleted", slug=slug, by=str(current.id))
