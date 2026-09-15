from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import OnboardingStatus
from app.common.pagination import Page, PageParams
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.onboarding.schemas import (
    OnboardingConvert,
    OnboardingCreate,
    OnboardingListRead,
    OnboardingRead,
    OnboardingStatusUpdate,
    OnboardingTaskCreate,
    OnboardingTaskUpdate,
    OnboardingUpdate,
)
from app.modules.onboarding.service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

ViewUser = Annotated[User, Depends(require_permission(Permission.ONBOARDING_VIEW))]
ManageUser = Annotated[User, Depends(require_permission(Permission.ONBOARDING_MANAGE))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=Page[OnboardingListRead])
async def list_onboarding(
    current_user: ViewUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    onboarding_status: OnboardingStatus | None = Query(None),
) -> Page[OnboardingListRead]:
    return await OnboardingService(db).list(
        PageParams(page=page, size=size),
        search=search,
        status=onboarding_status,
    )


@router.get("/by-candidate/{candidate_id}", response_model=OnboardingRead)
async def get_onboarding_by_candidate(
    candidate_id: int, current_user: ViewUser, db: DbSession
) -> OnboardingRead:
    onboarding = await OnboardingService(db).get_by_candidate(candidate_id)
    return OnboardingRead.model_validate(onboarding)


@router.get("/{onboarding_id}", response_model=OnboardingRead)
async def get_onboarding(
    onboarding_id: int, current_user: ViewUser, db: DbSession
) -> OnboardingRead:
    onboarding = await OnboardingService(db).get(onboarding_id)
    return OnboardingRead.model_validate(onboarding)


@router.post("", response_model=OnboardingRead, status_code=status.HTTP_201_CREATED)
async def create_onboarding(
    data: OnboardingCreate, current_user: ManageUser, db: DbSession
) -> OnboardingRead:
    onboarding = await OnboardingService(db).create(data, current_user)
    return OnboardingRead.model_validate(onboarding)


@router.patch("/{onboarding_id}", response_model=OnboardingRead)
async def update_onboarding(
    onboarding_id: int,
    data: OnboardingUpdate,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).update(onboarding_id, data)
    return OnboardingRead.model_validate(onboarding)


@router.post("/{onboarding_id}/status", response_model=OnboardingRead)
async def set_onboarding_status(
    onboarding_id: int,
    data: OnboardingStatusUpdate,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).set_status(onboarding_id, data.status)
    return OnboardingRead.model_validate(onboarding)


@router.post(
    "/{onboarding_id}/tasks",
    response_model=OnboardingRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_task(
    onboarding_id: int,
    data: OnboardingTaskCreate,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).add_task(onboarding_id, data)
    return OnboardingRead.model_validate(onboarding)


@router.patch("/{onboarding_id}/tasks/{task_id}", response_model=OnboardingRead)
async def update_task(
    onboarding_id: int,
    task_id: int,
    data: OnboardingTaskUpdate,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).update_task(onboarding_id, task_id, data)
    return OnboardingRead.model_validate(onboarding)


@router.delete("/{onboarding_id}/tasks/{task_id}", response_model=OnboardingRead)
async def delete_task(
    onboarding_id: int,
    task_id: int,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).delete_task(onboarding_id, task_id)
    return OnboardingRead.model_validate(onboarding)


@router.post("/{onboarding_id}/convert", response_model=OnboardingRead)
async def convert_to_employee(
    onboarding_id: int,
    data: OnboardingConvert,
    current_user: ManageUser,
    db: DbSession,
) -> OnboardingRead:
    onboarding = await OnboardingService(db).convert_to_employee(onboarding_id, data)
    return OnboardingRead.model_validate(onboarding)
