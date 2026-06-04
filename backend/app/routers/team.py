"""Admin CRUD for team members."""

from __future__ import annotations

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, NotFoundError
from app.logging import logger
from app.models import TeamMember as TeamModel
from app.schemas import TeamMember, TeamMemberPatch

router = APIRouter(prefix="/admin/team", tags=["admin", "team"])


@router.get("", response_model=list[TeamMember])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[TeamMember]:
    rows = await db.execute(select(TeamModel).order_by(TeamModel.position, TeamModel.id))
    return [TeamMember.model_validate(r.data) for r in rows.scalars()]


@router.put("", response_model=list[TeamMember])
async def replace_all(
    payload: list[TeamMember], current: CurrentAdmin, db: DbSession
) -> list[TeamMember]:
    ids = {m.id for m in payload}
    if len(ids) != len(payload):
        raise ConflictError("Duplicate ids in payload.")

    existing = (await db.execute(select(TeamModel))).scalars().all()
    by_id = {r.id: r for r in existing}

    for r in existing:
        if r.id not in ids:
            await db.delete(r)

    for idx, item in enumerate(payload):
        row = by_id.get(item.id)
        if row is None:
            db.add(TeamModel(id=item.id, position=idx, data=item.model_dump()))
        else:
            row.position = idx
            row.data = item.model_dump()

    await db.flush()
    logger.info("team_replaced", count=len(payload), by=str(current.id))
    return payload


@router.post("", response_model=TeamMember, status_code=status.HTTP_201_CREATED)
async def create(payload: TeamMember, current: CurrentAdmin, db: DbSession) -> TeamMember:
    if await db.get(TeamModel, payload.id) is not None:
        raise ConflictError(f"Team member '{payload.id}' already exists.")
    max_pos = (await db.execute(select(func.coalesce(func.max(TeamModel.position), -1)))).scalar_one()
    db.add(TeamModel(id=payload.id, position=max_pos + 1, data=payload.model_dump()))
    await db.flush()
    logger.info("team_created", id=payload.id, by=str(current.id))
    return payload


@router.put("/{member_id}", response_model=TeamMember)
async def update(
    member_id: str, payload: TeamMember, current: CurrentAdmin, db: DbSession
) -> TeamMember:
    row = await db.get(TeamModel, member_id)
    if row is None:
        raise NotFoundError(f"Team member '{member_id}' not found.")
    if payload.id != member_id:
        if await db.get(TeamModel, payload.id) is not None:
            raise ConflictError(f"Id '{payload.id}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(TeamModel(id=payload.id, position=existing_pos, data=payload.model_dump()))
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("team_updated", id=payload.id, by=str(current.id))
    return payload


@router.patch("/{member_id}", response_model=TeamMember)
async def patch(
    member_id: str, payload: TeamMemberPatch, current: CurrentAdmin, db: DbSession
) -> TeamMember:
    """Partial update — merges provided fields and re-validates the full doc."""
    row = await db.get(TeamModel, member_id)
    if row is None:
        raise NotFoundError(f"Team member '{member_id}' not found.")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return TeamMember.model_validate(row.data)

    new_id = updates.get("id", member_id)
    validated = TeamMember.model_validate({**row.data, **updates})

    if new_id != member_id:
        if await db.get(TeamModel, new_id) is not None:
            raise ConflictError(f"Id '{new_id}' is already taken.")
        existing_pos = row.position
        await db.delete(row)
        await db.flush()
        db.add(TeamModel(id=new_id, position=existing_pos, data=validated.model_dump()))
    else:
        row.data = validated.model_dump()

    await db.flush()
    logger.info("team_patched", id=new_id, by=str(current.id), fields=sorted(updates.keys()))
    return validated


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(member_id: str, current: CurrentAdmin, db: DbSession) -> None:
    row = await db.get(TeamModel, member_id)
    if row is None:
        raise NotFoundError(f"Team member '{member_id}' not found.")
    await db.delete(row)
    logger.info("team_deleted", id=member_id, by=str(current.id))


@router.post("/reorder", response_model=list[TeamMember])
async def reorder(ids: list[str], current: CurrentAdmin, db: DbSession) -> list[TeamMember]:
    rows = (await db.execute(select(TeamModel))).scalars().all()
    by_id = {r.id: r for r in rows}
    missing = [i for i in ids if i not in by_id]
    if missing:
        raise NotFoundError(f"Unknown ids: {', '.join(missing)}")
    for idx, mid in enumerate(ids):
        by_id[mid].position = idx
    await db.flush()
    logger.info("team_reordered", by=str(current.id), order=ids)
    ordered = sorted(rows, key=lambda r: (r.position, r.id))
    return [TeamMember.model_validate(r.data) for r in ordered]
