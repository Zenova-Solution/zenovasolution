"""Add client_projects singleton table.

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-23

Holds the single client-project snapshot the client dashboard reads and the
team portal writes. JSONB body to stay in lockstep with the frontend
``ProjectSnapshot`` shape without further migrations.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "client_projects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("data", postgresql.JSONB, nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("id = 1", name="ck_client_projects_singleton"),
    )


def downgrade() -> None:
    op.drop_table("client_projects")
