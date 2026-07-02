"""Unauthenticated read endpoints used by the public site."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select

from app.deps import DbSession
from app.errors import NotFoundError
from app.models import BrandSettings, Job, Project, Service, SiteContent, TeamMember
from app.schemas import (
    BrandSettings as BrandSchema,
)
from app.schemas import (
    JobDetail,
    ProjectDetail,
    ServiceDetail,
    SiteBundle,
)
from app.schemas import (
    SiteContent as SiteContentSchema,
)
from app.schemas import (
    TeamMember as TeamMemberSchema,
)

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/site", response_model=SiteBundle)
async def site(db: DbSession) -> SiteBundle:
    """Return everything the public site needs in one request."""
    services_q = await db.execute(select(Service).order_by(Service.position, Service.slug))
    projects_q = await db.execute(select(Project).order_by(Project.position, Project.slug))
    jobs_q = await db.execute(select(Job).order_by(Job.position, Job.slug))
    team_q = await db.execute(select(TeamMember).order_by(TeamMember.position, TeamMember.id))
    content_row = await db.get(SiteContent, 1)
    brand_row = await db.get(BrandSettings, 1)

    if content_row is None or brand_row is None:
        raise NotFoundError("Site content is not initialized — run the seed.")

    return SiteBundle(
        services=[ServiceDetail.model_validate(s.data) for s in services_q.scalars()],
        projects=[ProjectDetail.model_validate(p.data) for p in projects_q.scalars()],
        jobs=[JobDetail.model_validate(j.data) for j in jobs_q.scalars()],
        team=[TeamMemberSchema.model_validate(t.data) for t in team_q.scalars()],
        content=SiteContentSchema.model_validate(content_row.data),
        brand=BrandSchema.model_validate(brand_row.data),
    )


@router.get("/services", response_model=list[ServiceDetail])
async def list_services(db: DbSession) -> list[ServiceDetail]:
    rows = await db.execute(select(Service).order_by(Service.position, Service.slug))
    return [ServiceDetail.model_validate(s.data) for s in rows.scalars()]


@router.get("/services/{slug}", response_model=ServiceDetail)
async def get_service(slug: str, db: DbSession) -> ServiceDetail:
    row = await db.get(Service, slug)
    if row is None:
        raise NotFoundError(f"Service '{slug}' not found.")
    return ServiceDetail.model_validate(row.data)


@router.get("/projects", response_model=list[ProjectDetail])
async def list_projects(db: DbSession) -> list[ProjectDetail]:
    rows = await db.execute(select(Project).order_by(Project.position, Project.slug))
    return [ProjectDetail.model_validate(p.data) for p in rows.scalars()]


@router.get("/projects/{slug}", response_model=ProjectDetail)
async def get_project(slug: str, db: DbSession) -> ProjectDetail:
    row = await db.get(Project, slug)
    if row is None:
        raise NotFoundError(f"Project '{slug}' not found.")
    return ProjectDetail.model_validate(row.data)


@router.get("/jobs", response_model=list[JobDetail])
async def list_jobs(db: DbSession) -> list[JobDetail]:
    rows = await db.execute(select(Job).order_by(Job.position, Job.slug))
    return [JobDetail.model_validate(j.data) for j in rows.scalars()]


@router.get("/jobs/{slug}", response_model=JobDetail)
async def get_job(slug: str, db: DbSession) -> JobDetail:
    row = await db.get(Job, slug)
    if row is None:
        raise NotFoundError(f"Job '{slug}' not found.")
    return JobDetail.model_validate(row.data)
