from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError, PermissionError
from app.common.pagination import Page, PageParams
from app.core.security import hash_password
from app.modules.auth.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def list(
        self, params: PageParams, search: str | None = None
    ) -> Page[UserRead]:
        items, total = await self.repo.list(params, search)
        return Page.create(
            items=[UserRead.model_validate(u) for u in items],
            total=total,
            params=params,
        )

    async def get(self, user_id: int) -> User:
        user = await self.repo.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    async def create(self, data: UserCreate) -> User:
        if await self.repo.get_by_email(data.email) is not None:
            raise ConflictError("A user with this email already exists")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
            is_active=data.is_active,
        )
        return await self.repo.create(user)

    async def update(self, user_id: int, data: UserUpdate, actor_id: int) -> User:
        user = await self.get(user_id)
        updates = data.model_dump(exclude_unset=True)

        # Don't let an admin lock themselves out.
        if user.id == actor_id:
            if updates.get("is_active") is False:
                raise PermissionError("You cannot deactivate your own account")
            if "role" in updates and updates["role"] != user.role:
                raise PermissionError("You cannot change your own role")

        if "password" in updates:
            password = updates.pop("password")
            if password:
                user.hashed_password = hash_password(password)

        for field, value in updates.items():
            setattr(user, field, value)
        return user

    async def delete(self, user_id: int, actor_id: int) -> None:
        if user_id == actor_id:
            raise PermissionError("You cannot delete your own account")
        user = await self.get(user_id)
        await self.repo.delete(user)
