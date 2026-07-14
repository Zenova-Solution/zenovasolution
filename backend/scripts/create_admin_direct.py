"""Direct script to create a single admin user.

Usage:
    python -m scripts.create_admin_direct --email admin@zenova.agency --name "Admin User"

The script will prompt for a password interactively. Passing --password on the
command line is supported only for automation and is strongly discouraged.
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import hashlib
import base64

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import AdminUser
from app.config import get_settings


def _normalize_password(password: str) -> str:
    """Normalize password for bcrypt (max 72 bytes)."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= 72:
        return password
    digest = hashlib.sha256(password_bytes).digest()
    return base64.b64encode(digest).decode("utf-8")


def hash_password_direct(password: str) -> str:
    """Hash password using bcrypt directly."""
    normalized = _normalize_password(password)
    return bcrypt.hashpw(normalized.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _prompt_password() -> str:
    while True:
        password = getpass.getpass("Password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords do not match. Try again.")
            continue
        if len(password) < 8:
            print("Password must be at least 8 characters.")
            continue
        return password


async def create_admin_user(email: str, name: str, password: str, role: str = "admin") -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    email = email.lower().strip()
    password_hash = hash_password_direct(password)

    async with async_session() as session:
        existing = (
            await session.execute(select(AdminUser).where(AdminUser.email == email))
        ).scalar_one_or_none()

        if existing is not None:
            print(f"User already exists: {email}")
            await engine.dispose()
            return

        new_user = AdminUser(
            email=email,
            name=name,
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        session.add(new_user)
        await session.commit()
        print(f"Created {role}: {email}")

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a Zenova admin user.")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--name", required=True, help="Display name")
    parser.add_argument("--role", default="admin", help="Role (default: admin)")
    parser.add_argument(
        "--password",
        help="Password (interactive prompt is used if omitted; avoid passing on CLI)",
    )
    args = parser.parse_args()

    chosen_password = args.password or _prompt_password()
    asyncio.run(create_admin_user(args.email, args.name, chosen_password, args.role))
