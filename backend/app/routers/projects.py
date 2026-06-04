"""Admin CRUD for project entries."""

from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import Project
from app.schemas import ProjectDetail, ProjectPatch

router = APIRouter(prefix="/admin/projects", tags=["admin", "projects"])


@router.get("", response_model=list[ProjectDetail])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[ProjectDetail]:
    rows = await db.execute(select(Project).order_by(Project.position, Project.slug))
    return [ProjectDetail.model_validate(r.data) for r in rows.scalars()]


@router.put("", response_model=list[ProjectDetail])
async def replace_all(
    payload: list[ProjectDetail], current: CurrentAdmin, db: DbSession
) -> list[ProjectDetail]:
    """Replace the entire collection."""
    slugs = {p.slug for p in payload}
    if len(slugs) != len(payload):
        raise ConflictError("Duplicate slugs in payload.")

    existing = (await db.execute(select(Project))).scalars().all()
    by_slug = {r.slug: r for r in existing}

    for r in existing:
        if r.slug not in slugs:
            await db.delete(r)

    for idx, item in enumerate(payload):
        row = by_slug.get(item.slug)
        if row is None:
            db.add(Project(slug=item.slug, position=idx, data=item.model_dump()))
        else:
            row.position = idx
            row.data = item.model_dump()

    await db.flush()
    logger.info("projects_replaced", count=len(payload), by=str(current.id))
    return payload


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
async def create(
    payload: ProjectDetail, current: CurrentAdmin, db: DbSession
) -> ProjectDetail:
    existing = await db.get(Project, payload.slug)
    if existing is not None:
        raise ConflictError(f"Project '{payload.slug}' already exists.")
    max_pos = (await db.execute(select(func.coalesce(func.max(Project.position), -1)))).scalar_one()
    row = Project(slug=payload.slug, position=max_pos + 1, data=payload.model_dump())
    db.add(row)
    await db.flush()
    logger.info("project_created", slug=payload.slug, by=str(current.id))
    return payload


@router.get("/{slug}", response_model=ProjectDetail)
async def get_one(slug: str, _: CurrentAdmin, db: DbSession) -> ProjectDetail:
    row = await db.get(Project, slug)
    if row is None:
        raise NotFoundError(f"Project '{slug}' not found.")
    return ProjectDetail.model_validate(row.data)


@router.put("/{slug}", response_model=ProjectDetail)
async def update(
    slug: str, payload: ProjectDetail, current: CurrentAdmin, db: DbSession
) -> ProjectDetail:
    row = await db.get(Project, slug)
    if row is None:
        raise NotFoundError(f"Project '{slug}' not found.")
    if payload.slug != slug:
        if await db.get(Project, payload.slug) is not None:
            raise ConflictError(f"Slug '{payload.slug}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(Project(slug=payload.slug, position=existing_pos, data=payload.model_dump()))
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("project_updated", slug=payload.slug, by=str(current.id))
    return payload


@router.patch("/{slug}", response_model=ProjectDetail)
async def patch(
    slug: str, payload: ProjectPatch, current: CurrentAdmin, db: DbSession
) -> ProjectDetail:
    """Partial update — merges provided fields and re-validates the full doc."""
    row = await db.get(Project, slug)
    if row is None:
        raise NotFoundError(f"Project '{slug}' not found.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return ProjectDetail.model_validate(row.data)

    new_slug = updates.get("slug", slug)
    validated = ProjectDetail.model_validate({**row.data, **updates})

    if new_slug != slug:
        if await db.get(Project, new_slug) is not None:
            raise ConflictError(f"Slug '{new_slug}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(Project(slug=new_slug, position=existing_pos, data=validated.model_dump()))
    else:
        row.data = validated.model_dump()

    await db.flush()
    logger.info(
        "project_patched", slug=new_slug, by=str(current.id), fields=sorted(updates.keys())
    )
    return validated


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(slug: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(Project, slug)
    if row is None:
        raise NotFoundError(f"Project '{slug}' not found.")
    await db.delete(row)
    logger.info("project_deleted", slug=slug, by=str(current.id))


@router.post("/reorder", response_model=list[ProjectDetail])
async def reorder(slugs: list[str], current: CurrentAdmin, db: DbSession) -> list[ProjectDetail]:
    rows = (await db.execute(select(Project))).scalars().all()
    by_slug = {r.slug: r for r in rows}
    missing = [s for s in slugs if s not in by_slug]
    if missing:
        raise NotFoundError(f"Unknown slugs: {', '.join(missing)}")
    for idx, slug in enumerate(slugs):
        by_slug[slug].position = idx
    await db.flush()
    logger.info("projects_reordered", by=str(current.id), order=slugs)
    ordered = sorted(rows, key=lambda r: (r.position, r.slug))
    return [ProjectDetail.model_validate(r.data) for r in ordered]
