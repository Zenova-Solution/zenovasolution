"""Seed default content into the database.

Loads JSON fixtures from ``backend/scripts/seed_data/`` (services, projects,
team, content, brand) and upserts them. Idempotent — safe to re-run.

Usage:
    python -m scripts.seed              # seed everything if empty
    python -m scripts.seed --force      # overwrite existing rows
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select

from app.db import session_scope
from app.models import (
    BrandSettings,
    ClientProject,
    Job,
    Project,
    Service,
    SiteContent,
    TeamMember,
)
from app.schemas import (
    BrandSettings as BrandSchema,
)
from app.schemas import (
    JobDetail,
    ProjectDetail,
    ProjectSnapshot,
    ServiceDetail,
)
from app.schemas import (
    SiteContent as SiteContentSchema,
)
from app.schemas import (
    TeamMember as TeamMemberSchema,
)

SEED_DIR = Path(__file__).parent / "seed_data"


def _load(name: str) -> Any:
    return json.loads((SEED_DIR / f"{name}.json").read_text(encoding="utf-8"))


async def seed(force: bool) -> None:
    async with session_scope() as db:
        services_raw = _load("services")
        projects_raw = _load("projects")
        jobs_raw = _load("jobs")
        team_raw = _load("team")
        content_raw = _load("content")
        brand_raw = _load("brand")
        client_project_raw = _load("client_project")

        # Validate every fixture through Pydantic before touching the DB.
        services = [ServiceDetail.model_validate(s) for s in services_raw]
        projects = [ProjectDetail.model_validate(p) for p in projects_raw]
        jobs = [JobDetail.model_validate(j) for j in jobs_raw]
        team = [TeamMemberSchema.model_validate(t) for t in team_raw]
        content = SiteContentSchema.model_validate(content_raw)
        brand = BrandSchema.model_validate(brand_raw)
        client_project = ProjectSnapshot.model_validate(client_project_raw)

        if force:
            await db.execute(delete(Service))
            await db.execute(delete(Project))
            await db.execute(delete(Job))
            await db.execute(delete(TeamMember))

        existing_services = {s.slug for s in (await db.execute(select(Service))).scalars()}
        for idx, s in enumerate(services):
            if s.slug in existing_services and not force:
                continue
            db.add(Service(slug=s.slug, position=idx, data=s.model_dump()))

        existing_projects = {p.slug for p in (await db.execute(select(Project))).scalars()}
        for idx, p in enumerate(projects):
            if p.slug in existing_projects and not force:
                continue
            db.add(Project(slug=p.slug, position=idx, data=p.model_dump()))

        existing_jobs = {j.slug for j in (await db.execute(select(Job))).scalars()}
        for idx, j in enumerate(jobs):
            if j.slug in existing_jobs and not force:
                continue
            db.add(Job(slug=j.slug, position=idx, data=j.model_dump()))

        existing_team = {t.id for t in (await db.execute(select(TeamMember))).scalars()}
        for idx, t in enumerate(team):
            if t.id in existing_team and not force:
                continue
            db.add(TeamMember(id=t.id, position=idx, data=t.model_dump()))

        content_row = await db.get(SiteContent, 1)
        if content_row is None:
            db.add(SiteContent(id=1, data=content.model_dump()))
        elif force:
            content_row.data = content.model_dump()

        brand_row = await db.get(BrandSettings, 1)
        if brand_row is None:
            db.add(BrandSettings(id=1, data=brand.model_dump()))
        elif force:
            brand_row.data = brand.model_dump()

        cp_row = await db.get(ClientProject, 1)
        if cp_row is None:
            db.add(ClientProject(id=1, data=client_project.model_dump()))
        elif force:
            cp_row.data = client_project.model_dump()

    print("Seed complete.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Overwrite existing rows.")
    args = parser.parse_args()
    asyncio.run(seed(args.force))


if __name__ == "__main__":
    main()
