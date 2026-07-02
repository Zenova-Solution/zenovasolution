"""Admin CRUD for job / career entries."""

from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import Job
from app.schemas import JobDetail, JobPatch

router = APIRouter(prefix="/admin/jobs", tags=["admin", "jobs"])


@router.get("", response_model=list[JobDetail])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[JobDetail]:
    rows = await db.execute(select(Job).order_by(Job.position, Job.slug))
    return [JobDetail.model_validate(r.data) for r in rows.scalars()]


@router.put("", response_model=list[JobDetail])
async def replace_all(
    payload: list[JobDetail], current: CurrentAdmin, db: DbSession
) -> list[JobDetail]:
    """Replace the entire collection."""
    slugs = {j.slug for j in payload}
    if len(slugs) != len(payload):
        raise ConflictError("Duplicate slugs in payload.")

    existing = (await db.execute(select(Job))).scalars().all()
    by_slug = {r.slug: r for r in existing}

    for r in existing:
        if r.slug not in slugs:
            await db.delete(r)

    for idx, item in enumerate(payload):
        row = by_slug.get(item.slug)
        if row is None:
            db.add(Job(slug=item.slug, position=idx, data=item.model_dump()))
        else:
            row.position = idx
            row.data = item.model_dump()

    await db.flush()
    logger.info("jobs_replaced", count=len(payload), by=str(current.id))
    return payload


@router.post("", response_model=JobDetail, status_code=status.HTTP_201_CREATED)
async def create(
    payload: JobDetail, current: CurrentAdmin, db: DbSession
) -> JobDetail:
    existing = await db.get(Job, payload.slug)
    if existing is not None:
        raise ConflictError(f"Job '{payload.slug}' already exists.")
    max_pos = (await db.execute(select(func.coalesce(func.max(Job.position), -1)))).scalar_one()
    row = Job(slug=payload.slug, position=max_pos + 1, data=payload.model_dump())
    db.add(row)
    await db.flush()
    logger.info("job_created", slug=payload.slug, by=str(current.id))
    return payload


@router.get("/{slug}", response_model=JobDetail)
async def get_one(slug: str, _: CurrentAdmin, db: DbSession) -> JobDetail:
    row = await db.get(Job, slug)
    if row is None:
        raise NotFoundError(f"Job '{slug}' not found.")
    return JobDetail.model_validate(row.data)


@router.put("/{slug}", response_model=JobDetail)
async def update(
    slug: str, payload: JobDetail, current: CurrentAdmin, db: DbSession
) -> JobDetail:
    row = await db.get(Job, slug)
    if row is None:
        raise NotFoundError(f"Job '{slug}' not found.")
    if payload.slug != slug:
        if await db.get(Job, payload.slug) is not None:
            raise ConflictError(f"Slug '{payload.slug}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(Job(slug=payload.slug, position=existing_pos, data=payload.model_dump()))
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("job_updated", slug=payload.slug, by=str(current.id))
    return payload


@router.patch("/{slug}", response_model=JobDetail)
async def patch(
    slug: str, payload: JobPatch, current: CurrentAdmin, db: DbSession
) -> JobDetail:
    """Partial update — merges provided fields and re-validates the full doc."""
    row = await db.get(Job, slug)
    if row is None:
        raise NotFoundError(f"Job '{slug}' not found.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return JobDetail.model_validate(row.data)

    new_slug = updates.get("slug", slug)
    validated = JobDetail.model_validate({**row.data, **updates})

    if new_slug != slug:
        if await db.get(Job, new_slug) is not None:
            raise ConflictError(f"Slug '{new_slug}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(Job(slug=new_slug, position=existing_pos, data=validated.model_dump()))
    else:
        row.data = validated.model_dump()

    await db.flush()
    logger.info(
        "job_patched", slug=new_slug, by=str(current.id), fields=sorted(updates.keys())
    )
    return validated


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(slug: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(Job, slug)
    if row is None:
        raise NotFoundError(f"Job '{slug}' not found.")
    await db.delete(row)
    logger.info("job_deleted", slug=slug, by=str(current.id))


@router.post("/reorder", response_model=list[JobDetail])
async def reorder(slugs: list[str], current: CurrentAdmin, db: DbSession) -> list[JobDetail]:
    rows = (await db.execute(select(Job))).scalars().all()
    by_slug = {r.slug: r for r in rows}
    missing = [s for s in slugs if s not in by_slug]
    if missing:
        raise NotFoundError(f"Unknown slugs: {', '.join(missing)}")
    for idx, slug in enumerate(slugs):
        by_slug[slug].position = idx
    await db.flush()
    logger.info("jobs_reordered", by=str(current.id), order=slugs)
    ordered = sorted(rows, key=lambda r: (r.position, r.slug))
    return [JobDetail.model_validate(r.data) for r in ordered]
