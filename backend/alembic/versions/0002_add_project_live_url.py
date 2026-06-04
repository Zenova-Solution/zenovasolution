"""Add liveUrl field to projects

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-23

This documents the addition of an optional liveUrl field to the projects JSONB
schema. No table structure changes needed since projects.data is JSONB (schema-free).

The field is now part of the ProjectDetail Pydantic schema and will be stored
in the JSONB data column.
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """No SQL changes needed; JSONB column is schema-free.

    The liveUrl field is now part of the ProjectDetail schema and will be
    stored in the projects.data JSONB column as an optional string.
    """
    pass


def downgrade() -> None:
    """No changes to revert; JSONB is flexible."""
    pass
