"""Create (or ensure) a single admin user — nothing else.

Safe and idempotent: it only ever *adds* an admin if one with that email
doesn't already exist. It never deletes or modifies other data.

Usage (from the backend directory, after `alembic upgrade head`):

    python -m scripts.seed_admin

Credentials default to the values below but can be overridden with env vars:

    ADMIN_EMAIL=you@company.com ADMIN_PASSWORD=supersecret python -m scripts.seed_admin
"""

import asyncio
import os

from sqlalchemy import select

from app.common.enums import UserRole
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.models import User

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@hrms.local")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Admin")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        if existing:
            print(f"= admin {ADMIN_EMAIL} already exists — nothing to do")
            return
        session.add(
            User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                full_name=ADMIN_NAME,
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        await session.commit()
        print(f"+ created admin {ADMIN_EMAIL} (password: {ADMIN_PASSWORD})")


if __name__ == "__main__":
    asyncio.run(main())
