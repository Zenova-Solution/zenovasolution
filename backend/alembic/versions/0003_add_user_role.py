"""Add role column to admin_users for RBAC

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-23

Adds a ``role`` column to ``admin_users`` so the same auth table can back
admin, team, and client portals. Existing rows are backfilled to ``admin`` so
the current admin accounts keep working. A CHECK constraint pins the column
to the three supported values.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column(
            "role",
            sa.String(16),
            nullable=False,
            server_default="admin",
        ),
    )
    op.create_index("ix_admin_users_role", "admin_users", ["role"])
    op.create_check_constraint(
        "ck_admin_users_role",
        "admin_users",
        "role IN ('admin', 'team', 'client')",
    )
    # Drop the server default now that existing rows have been backfilled —
    # the app supplies an explicit value on insert.
    op.alter_column("admin_users", "role", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_admin_users_role", "admin_users", type_="check")
    op.drop_index("ix_admin_users_role", table_name="admin_users")
    op.drop_column("admin_users", "role")
