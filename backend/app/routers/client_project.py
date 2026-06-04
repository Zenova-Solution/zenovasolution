"""Client-project snapshot endpoints.

Two surfaces over the same row:
- ``GET /client/me/project``    — client portal reads the snapshot (role: client or admin)
- ``GET /team/project``         — team portal reads (role: team or admin)
- ``PUT /team/project``         — team portal replaces the snapshot
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import DbSession, RequireClient, RequireTeam
from app.errors import NotFoundError
from app.logging import logger
from app.models import ClientProject as ClientProjectModel
from app.schemas import ProjectSnapshot

router = APIRouter(tags=["client-project"])


async def _read_snapshot(db: DbSession) -> ProjectSnapshot:
    row = await db.get(ClientProjectModel, 1)
    if row is None:
        raise NotFoundError("No project snapshot has been seeded yet.")
    return ProjectSnapshot.model_validate(row.data)


@router.get("/client/me/project", response_model=ProjectSnapshot)
async def client_get(_: RequireClient, db: DbSession) -> ProjectSnapshot:
    return await _read_snapshot(db)


@router.get("/team/project", response_model=ProjectSnapshot)
async def team_get(_: RequireTeam, db: DbSession) -> ProjectSnapshot:
    return await _read_snapshot(db)


@router.put("/team/project", response_model=ProjectSnapshot)
async def team_put(
    payload: ProjectSnapshot,
    current: RequireTeam,
    db: DbSession,
) -> ProjectSnapshot:
    row = await db.get(ClientProjectModel, 1)
    if row is None:
        row = ClientProjectModel(id=1, data=payload.model_dump())
        db.add(row)
    else:
        row.data = payload.model_dump()
    await db.flush()
    logger.info("client_project_updated", by=str(current.id), role=current.role)
    return payload
