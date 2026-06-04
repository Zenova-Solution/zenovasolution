"""Admin CRUD for service entries."""

from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import Service
from app.schemas import ServiceDetail, ServicePatch

router = APIRouter(prefix="/admin/services", tags=["admin", "services"])


@router.get("", response_model=list[ServiceDetail])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[ServiceDetail]:
    rows = await db.execute(select(Service).order_by(Service.position, Service.slug))
    return [ServiceDetail.model_validate(r.data) for r in rows.scalars()]


@router.put("", response_model=list[ServiceDetail])
async def replace_all(
    payload: list[ServiceDetail], current: CurrentAdmin, db: DbSession
) -> list[ServiceDetail]:
    """Replace the entire collection — admin saves the array as a single document."""
    slugs = {s.slug for s in payload}
    if len(slugs) != len(payload):
        raise ConflictError("Duplicate slugs in payload.")

    existing = (await db.execute(select(Service))).scalars().all()
    by_slug = {r.slug: r for r in existing}

    for r in existing:
        if r.slug not in slugs:
            await db.delete(r)

    for idx, item in enumerate(payload):
        row = by_slug.get(item.slug)
        if row is None:
            db.add(Service(slug=item.slug, position=idx, data=item.model_dump()))
        else:
            row.position = idx
            row.data = item.model_dump()

    await db.flush()
    logger.info("services_replaced", count=len(payload), by=str(current.id))
    return payload


@router.post("", response_model=ServiceDetail, status_code=status.HTTP_201_CREATED)
async def create(
    payload: ServiceDetail, current: CurrentAdmin, db: DbSession
) -> ServiceDetail:
    existing = await db.get(Service, payload.slug)
    if existing is not None:
        raise ConflictError(f"Service '{payload.slug}' already exists.")
    max_pos = (await db.execute(select(func.coalesce(func.max(Service.position), -1)))).scalar_one()
    row = Service(slug=payload.slug, position=max_pos + 1, data=payload.model_dump())
    db.add(row)
    await db.flush()
    logger.info("service_created", slug=payload.slug, by=str(current.id))
    return payload


@router.get("/{slug}", response_model=ServiceDetail)
async def get_one(slug: str, _: CurrentAdmin, db: DbSession) -> ServiceDetail:
    row = await db.get(Service, slug)
    if row is None:
        raise NotFoundError(f"Service '{slug}' not found.")
    return ServiceDetail.model_validate(row.data)


@router.put("/{slug}", response_model=ServiceDetail)
async def update(
    slug: str, payload: ServiceDetail, current: CurrentAdmin, db: DbSession
) -> ServiceDetail:
    row = await db.get(Service, slug)
    if row is None:
        raise NotFoundError(f"Service '{slug}' not found.")
    if payload.slug != slug:
        # Slug rename — make sure target doesn't already exist
        if await db.get(Service, payload.slug) is not None:
            raise ConflictError(f"Slug '{payload.slug}' is already taken.")
        # Replace the row so the PK changes
        await db.delete(row)
        await db.flush()
        max_pos_existing = row.position
        new_row = Service(slug=payload.slug, position=max_pos_existing, data=payload.model_dump())
        db.add(new_row)
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("service_updated", slug=payload.slug, by=str(current.id))
    return payload


@router.patch("/{slug}", response_model=ServiceDetail)
async def patch(
    slug: str, payload: ServicePatch, current: CurrentAdmin, db: DbSession
) -> ServiceDetail:
    """Partial update — merges the provided fields into the stored JSON."""
    row = await db.get(Service, slug)
    if row is None:
        raise NotFoundError(f"Service '{slug}' not found.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return ServiceDetail.model_validate(row.data)

    new_slug = updates.get("slug", slug)
    validated = ServiceDetail.model_validate({**row.data, **updates})

    if new_slug != slug:
        if await db.get(Service, new_slug) is not None:
            raise ConflictError(f"Slug '{new_slug}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(Service(slug=new_slug, position=existing_pos, data=validated.model_dump()))
    else:
        row.data = validated.model_dump()

    await db.flush()
    logger.info(
        "service_patched", slug=new_slug, by=str(current.id), fields=sorted(updates.keys())
    )
    return validated


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(slug: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(Service, slug)
    if row is None:
        raise NotFoundError(f"Service '{slug}' not found.")
    await db.delete(row)
    logger.info("service_deleted", slug=slug, by=str(current.id))


@router.post("/reorder", response_model=list[ServiceDetail])
async def reorder(slugs: list[str], current: CurrentAdmin, db: DbSession) -> list[ServiceDetail]:
    """Reorder by submitting the slugs in the desired order."""
    rows = (await db.execute(select(Service))).scalars().all()
    by_slug = {r.slug: r for r in rows}
    missing = [s for s in slugs if s not in by_slug]
    if missing:
        raise NotFoundError(f"Unknown slugs: {', '.join(missing)}")
    for idx, slug in enumerate(slugs):
        by_slug[slug].position = idx
    await db.flush()
    logger.info("services_reordered", by=str(current.id), order=slugs)
    ordered = sorted(rows, key=lambda r: (r.position, r.slug))
    return [ServiceDetail.model_validate(r.data) for r in ordered]
