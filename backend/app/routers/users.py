"""Admin CRUD for auth accounts (admin / team / client users).

Unlike the content routers (services, team, …) this one maps real columns on
``admin_users`` instead of a JSONB document, so it must hash passwords, keep
emails lowercase, and never expose ``password_hash``.

Safety rails: an admin cannot demote, deactivate, or delete their own account,
and no operation may leave the system without an active admin.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import CurrentAdmin, DbSession
from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.logging import logger
from app.models import AdminUser
from app.schemas import AdminUserOut, UserCreate, UserPatch
from app.security import hash_password

router = APIRouter(prefix="/admin/users", tags=["admin", "users"])


def _to_out(u: AdminUser) -> AdminUserOut:
    return AdminUserOut(
        id=str(u.id),
        email=u.email,
        name=u.name,
        role=u.role,  # type: ignore[arg-type]  -- validated by the CHECK constraint
        is_active=u.is_active,
        created_at=u.created_at,
    )


async def _email_taken(db: AsyncSession, email: str) -> bool:
    stmt = select(AdminUser.id).where(AdminUser.email == email)
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def _guard_last_active_admin(db: AsyncSession, target: AdminUser) -> None:
    """Refuse operations that would leave zero active admins.

    Locks the active-admin rows so two concurrent demotions serialize instead
    of both succeeding.
    """
    if target.role != "admin" or not target.is_active:
        return
    stmt = (
        select(AdminUser.id)
        .where(AdminUser.role == "admin", AdminUser.is_active.is_(True))
        .with_for_update()
    )
    active_ids = (await db.execute(stmt)).scalars().all()
    if all(i == target.id for i in active_ids):
        raise ConflictError("Cannot remove the last active admin account.", code="last_admin")


@router.get("", response_model=list[AdminUserOut])
async def list_all(_: CurrentAdmin, db: DbSession) -> list[AdminUserOut]:
    rows = await db.execute(select(AdminUser).order_by(AdminUser.created_at.desc()))
    return [_to_out(u) for u in rows.scalars()]


@router.post("", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
async def create(payload: UserCreate, current: CurrentAdmin, db: DbSession) -> AdminUserOut:
    email = payload.email.lower()
    if await _email_taken(db, email):
        raise ConflictError("A user with this email already exists.")
    user = AdminUser(
        email=email,
        name=payload.name,
        role=payload.role,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    await db.flush()
    logger.info(
        "user_created", user_id=str(user.id), email=email, role=user.role, by=str(current.id)
    )
    return _to_out(user)


@router.patch("/{user_id}", response_model=AdminUserOut)
async def patch(
    user_id: uuid.UUID, payload: UserPatch, current: CurrentAdmin, db: DbSession
) -> AdminUserOut:
    user = await db.get(AdminUser, user_id)
    if user is None:
        raise NotFoundError("User not found.")

    # No column is nullable, so an explicit null means "leave unchanged".
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        return _to_out(user)

    if user.id == current.id:
        if updates.get("role", "admin") != "admin":
            raise ForbiddenError("You cannot change your own role.")
        if updates.get("is_active", True) is False:
            raise ForbiddenError("You cannot deactivate your own account.")

    new_role = updates.get("role", user.role)
    new_active = updates.get("is_active", user.is_active)
    if new_role != "admin" or not new_active:
        await _guard_last_active_admin(db, user)

    if "email" in updates:
        email = updates["email"].lower()
        if email != user.email and await _email_taken(db, email):
            raise ConflictError("A user with this email already exists.")
        user.email = email
    if "password" in updates:
        user.password_hash = hash_password(updates["password"])
    if "name" in updates:
        user.name = updates["name"]
    if "role" in updates:
        user.role = updates["role"]
    if "is_active" in updates:
        user.is_active = updates["is_active"]

    await db.flush()
    logger.info(
        "user_patched", user_id=str(user.id), fields=sorted(updates.keys()), by=str(current.id)
    )
    return _to_out(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(user_id: uuid.UUID, current: CurrentAdmin, db: DbSession) -> None:
    user = await db.get(AdminUser, user_id)
    if user is None:
        raise NotFoundError("User not found.")
    if user.id == current.id:
        raise ForbiddenError("You cannot delete your own account.")
    await _guard_last_active_admin(db, user)
    email = user.email
    await db.delete(user)
    logger.info("user_deleted", user_id=str(user_id), email=email, by=str(current.id))
