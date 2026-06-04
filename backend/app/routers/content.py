"""Admin endpoints for the singleton site content document."""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentAdmin, DbSession
from app.errors import NotFoundError
from app.logging import logger
from app.models import SiteContent as ContentModel
from app.schemas import SiteContent, SiteContentPatch

router = APIRouter(prefix="/admin/content", tags=["admin", "content"])


@router.get("", response_model=SiteContent)
async def read(_: CurrentAdmin, db: DbSession) -> SiteContent:
    row = await db.get(ContentModel, 1)
    if row is None:
        raise NotFoundError("Site content has not been initialised. Run the seed script.")
    return SiteContent.model_validate(row.data)


@router.put("", response_model=SiteContent)
async def replace(payload: SiteContent, current: CurrentAdmin, db: DbSession) -> SiteContent:
    row = await db.get(ContentModel, 1)
    if row is None:
        row = ContentModel(id=1, data=payload.model_dump())
        db.add(row)
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("content_updated", by=str(current.id))
    return payload


@router.patch("", response_model=SiteContent)
async def patch(
    payload: SiteContentPatch, current: CurrentAdmin, db: DbSession
) -> SiteContent:
    """Partial update — only the fields the client sends are touched.

    Nested objects (``hero``, ``cta``, ``testimonial``) are replaced wholesale
    when present; if you only need to tweak one sub-field, send the merged
    sub-object yourself.
    """
    row = await db.get(ContentModel, 1)
    if row is None:
        raise NotFoundError("Site content has not been initialised. Run the seed script.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return SiteContent.model_validate(row.data)
    validated = SiteContent.model_validate({**row.data, **updates})
    row.data = validated.model_dump()
    await db.flush()
    logger.info("content_patched", by=str(current.id), fields=sorted(updates.keys()))
    return validated
