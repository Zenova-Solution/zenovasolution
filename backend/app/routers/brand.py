"""Admin endpoints for the singleton brand settings document."""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentAdmin, DbSession
from app.errors import NotFoundError
from app.logging import logger
from app.models import BrandSettings as BrandModel
from app.schemas import BrandSettings, BrandSettingsPatch

router = APIRouter(prefix="/admin/brand", tags=["admin", "brand"])


@router.get("", response_model=BrandSettings)
async def read(_: CurrentAdmin, db: DbSession) -> BrandSettings:
    row = await db.get(BrandModel, 1)
    if row is None:
        raise NotFoundError("Brand settings have not been initialised. Run the seed script.")
    return BrandSettings.model_validate(row.data)


@router.put("", response_model=BrandSettings)
async def replace(
    payload: BrandSettings, current: CurrentAdmin, db: DbSession
) -> BrandSettings:
    row = await db.get(BrandModel, 1)
    if row is None:
        row = BrandModel(id=1, data=payload.model_dump())
        db.add(row)
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("brand_updated", by=str(current.id))
    return payload


@router.patch("", response_model=BrandSettings)
async def patch(
    payload: BrandSettingsPatch, current: CurrentAdmin, db: DbSession
) -> BrandSettings:
    """Partial update — only the fields the client sends are touched."""
    row = await db.get(BrandModel, 1)
    if row is None:
        raise NotFoundError("Brand settings have not been initialised. Run the seed script.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return BrandSettings.model_validate(row.data)
    validated = BrandSettings.model_validate({**row.data, **updates})
    row.data = validated.model_dump()
    await db.flush()
    logger.info("brand_patched", by=str(current.id), fields=sorted(updates.keys()))
    return validated
