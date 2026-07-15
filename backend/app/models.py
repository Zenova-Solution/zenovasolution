"""SQLAlchemy ORM models.

Design:
- ``services`` / ``projects`` / ``team_members`` keep slug/id + a position field
  for sort order, and store the full nested payload as JSONB so the shape stays
  in lockstep with the frontend without schema churn.
- ``site_content`` and ``brand_settings`` are singletons (id=1).
- All timestamps are timezone-aware.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class AdminUser(Base):
    """Auth user. Despite the legacy table name ``admin_users`` (kept to avoid a
    rename migration), rows here may have any role — admin, team, or client.
    Use the ``role`` column with the RBAC dependencies in :mod:`app.deps` to
    decide what they can access."""

    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="admin", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Service(Base):
    __tablename__ = "services"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Project(Base):
    __tablename__ = "projects"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Job(Base):
    __tablename__ = "jobs"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SiteContent(Base):
    __tablename__ = "site_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class BrandSettings(Base):
    __tablename__ = "brand_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ClientProject(Base):
    """The live snapshot the client portal renders and the team portal edits."""

    __tablename__ = "client_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Lead(Base):
    """A message submitted through the public contact form.

    Real columns (not JSONB) since the shape is fixed and the admin Inbox queries
    on ``is_read`` and ``created_at``.
    """

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    service: Mapped[str | None] = mapped_column(String(60), nullable=True)
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class BlogPost(Base):
    """An admin-authored blog post.

    Real columns (not JSONB) since the public listing filters on ``status`` and
    orders by ``published_at``.
    """

    __tablename__ = "blog_posts"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(
        String(12), nullable=False, default="draft", index=True
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    meta_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SeoPage(Base):
    """A standalone landing page served at a top-level URL (``/{slug}``).

    Not linked from site navigation — reachable by direct URL and sitemap only.
    """

    __tablename__ = "seo_pages"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    meta_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
