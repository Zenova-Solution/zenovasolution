"""add blog_posts and seo_pages tables

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-15
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0007"
down_revision: str | Sequence[str] | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "blog_posts",
        sa.Column("slug", sa.String(120), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("excerpt", sa.Text, nullable=False, server_default=""),
        sa.Column("content_html", sa.Text, nullable=False, server_default=""),
        sa.Column("cover_image_url", sa.Text, nullable=True),
        sa.Column("author_name", sa.String(120), nullable=True),
        sa.Column(
            "tags",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("status", sa.String(12), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("meta_title", sa.String(200), nullable=True),
        sa.Column("meta_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])
    op.create_index("ix_blog_posts_published_at", "blog_posts", ["published_at"])

    op.create_table(
        "seo_pages",
        sa.Column("slug", sa.String(120), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content_html", sa.Text, nullable=False, server_default=""),
        sa.Column("meta_title", sa.String(200), nullable=True),
        sa.Column("meta_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.Text, nullable=True),
        sa.Column(
            "is_published", sa.Boolean, nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_seo_pages_is_published", "seo_pages", ["is_published"])

    # Repair drift: Lead.service exists on the model but 0006 never created the
    # column. Idempotent so databases patched by hand are unaffected.
    op.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS service VARCHAR(60)")


def downgrade() -> None:
    op.drop_index("ix_seo_pages_is_published", table_name="seo_pages")
    op.drop_table("seo_pages")
    op.drop_index("ix_blog_posts_published_at", table_name="blog_posts")
    op.drop_index("ix_blog_posts_status", table_name="blog_posts")
    op.drop_table("blog_posts")
    # The leads.service repair is intentionally not reverted — the column is
    # harmless and may predate this migration on hand-patched databases.
