"""Direct script to create admin users using bcrypt directly."""

import asyncio
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
    return bcrypt.hashpw(normalized.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


async def create_admin_users():
    settings = get_settings()
    
    # Create engine
    engine = create_async_engine(settings.database_url, echo=False)
    
    # Create session factory
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    users_to_create = [
        {
            "email": "tanvir@zenovasolution.xyz",
            "name": "Tanvir Admin",
            "password": "12345678",
            "role": "admin",
        },
        {
            "email": "zisan@zenovasolution.xyz",
            "name": "Zisan Admin",
            "password": "12345678",
            "role": "admin",
        },
    ]
    
    async with async_session() as session:
        for user_data in users_to_create:
            email = user_data["email"].lower().strip()
            
            # Check if user exists
            existing = (
                await session.execute(select(AdminUser).where(AdminUser.email == email))
            ).scalar_one_or_none()
            
            if existing is None:
                # Hash password using bcrypt directly
                password_hash = hash_password_direct(user_data["password"])
                
                # Create new user
                new_user = AdminUser(
                    email=email,
                    name=user_data["name"],
                    password_hash=password_hash,
                    role=user_data["role"],
                    is_active=True,
                )
                session.add(new_user)
                print(f"Created {user_data['role']}: {email}")
            else:
                print(f"User already exists: {email}")
        
        await session.commit()
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin_users())
