from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import UserRole
from app.common.exceptions import AppError
from app.common.pagination import Page
from app.common.query import ListParamsDep
from app.common.schemas import BulkIds, BulkResult
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, require_permission
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate
from app.modules.users.service import UserService

# Entire module requires the users:manage permission (admin only).
router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(require_permission(Permission.USERS_MANAGE))],
)


@router.get("", response_model=Page[UserRead])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    params: ListParamsDep,
    role: UserRole | None = Query(None),
) -> Page[UserRead]:
    return await UserService(db).list(params.page_params, params.search, role)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRead:
    user = await UserService(db).create(data)
    return UserRead.model_validate(user)


@router.post("/bulk-delete", response_model=BulkResult)
async def bulk_delete_users(
    data: BulkIds,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BulkResult:
    service = UserService(db)
    deleted = 0
    for user_id in data.ids:
        try:
            await service.delete(user_id, actor_id=current_user.id)
            deleted += 1
        except AppError:
            continue
    return BulkResult(deleted=deleted)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRead:
    return UserRead.model_validate(await UserService(db).get(user_id))


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRead:
    user = await UserService(db).update(user_id, data, actor_id=current_user.id)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await UserService(db).delete(user_id, actor_id=current_user.id)
