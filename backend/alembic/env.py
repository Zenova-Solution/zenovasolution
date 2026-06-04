"""Alembic environment.

Builds the engine directly from the resolved URL (sync or async). We
intentionally bypass ``engine_from_config`` because Alembic's underlying
ConfigParser treats ``%`` as an interpolation token, which breaks
percent-encoded credentials in URLs (e.g. ``%3F`` for ``?``).
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import get_settings
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _resolve_url() -> str:
    settings = get_settings()
    # Prefer the explicit sync URL if provided. If it's still an asyncpg URL,
    # the async branch below handles it.
    if settings.database_url_sync:
        return settings.database_url_sync
    return settings.database_url


URL = _resolve_url()
IS_ASYNC = "+asyncpg" in URL

target_metadata = Base.metadata


def _do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_offline() -> None:
    context.configure(
        url=URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(URL, poolclass=pool.NullPool, future=True)
    async with connectable.connect() as connection:
        await connection.run_sync(_do_run_migrations)
    await connectable.dispose()


def run_migrations_online_sync() -> None:
    connectable = create_engine(URL, poolclass=pool.NullPool, future=True)
    with connectable.connect() as connection:
        _do_run_migrations(connection)
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
elif IS_ASYNC:
    asyncio.run(run_async_migrations())
else:
    run_migrations_online_sync()
