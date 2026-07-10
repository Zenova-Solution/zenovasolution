"""Pytest fixtures.

The default DB URL points at a local Postgres (`postgres@localhost:5432/zenova_test`).
Set ``TEST_DATABASE_URL`` to override. Migrations run once per session.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# Force a deterministic test config before app imports read env vars.
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("JWT_SECRET", "test-secret-" + "x" * 40)
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/zenova_test",
    ),
)
# JSON, not a bare string: pydantic-settings decodes complex env fields with
# json.loads before the csv field_validator ever runs.
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:5173"]')

from app.db import dispose_engine, get_engine, get_sessionmaker  # noqa: E402
from app.limiter import limiter  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_rate_limits() -> None:
    # The limiter is module-level with in-memory storage, so hits accumulate
    # across tests (every test logs in via /auth/login, limit 10/minute).
    limiter.reset()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _schema() -> AsyncIterator[None]:
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await dispose_engine()


@pytest_asyncio.fixture
async def db() -> AsyncIterator[AsyncSession]:
    sm = get_sessionmaker()
    async with sm() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
