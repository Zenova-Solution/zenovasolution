"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-20
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_admin_users_email", "admin_users", ["email"])

    for table in ("services", "projects"):
        op.create_table(
            table,
            sa.Column("slug", sa.String(120), primary_key=True),
            sa.Column("position", sa.Integer, nullable=False, server_default="0"),
            sa.Column("data", postgresql.JSONB, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index(f"ix_{table}_position", table, ["position"])

    op.create_table(
        "team_members",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("data", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_team_members_position", "team_members", ["position"])

    for singleton in ("site_content", "brand_settings"):
        op.create_table(
            singleton,
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("data", postgresql.JSONB, nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.CheckConstraint("id = 1", name=f"ck_{singleton}_singleton"),
        )


def downgrade() -> None:
    op.drop_table("brand_settings")
    op.drop_table("site_content")
    op.drop_index("ix_team_members_position", table_name="team_members")
    op.drop_table("team_members")
    for table in ("projects", "services"):
        op.drop_index(f"ix_{table}_position", table_name=table)
        op.drop_table(table)
    op.drop_index("ix_admin_users_email", table_name="admin_users")
    op.drop_table("admin_users")
