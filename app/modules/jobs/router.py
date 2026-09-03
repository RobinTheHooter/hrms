from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import JobStatus
from app.common.exceptions import AppError
from app.common.pagination import Page
from app.common.query import ListParamsDep
from app.common.schemas import BulkIds, BulkResult
from app.core.config import get_settings
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.jobs.schemas import (
    JobCreate,
    JobDescriptionRequest,
    JobDescriptionResponse,
    JobRead,
    JobUpdate,
)
from app.modules.jobs.service import JobService
from app.modules.screening import ai as screening_ai

router = APIRouter(prefix="/jobs", tags=["jobs"])

# These dependencies both enforce the permission and return the current user.
ViewUser = Annotated[User, Depends(require_permission(Permission.JOBS_VIEW))]
ManageUser = Annotated[User, Depends(require_permission(Permission.JOBS_MANAGE))]


@router.post("/ai/description", response_model=JobDescriptionResponse)
async def generate_job_description(
    current_user: ManageUser,
    payload: JobDescriptionRequest,
) -> JobDescriptionResponse:
    """Draft a job description from a title (+ optional hints) using AI."""
    if not get_settings().ai_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features aren't configured on the server yet.",
        )
    try:
        result = await screening_ai.generate_job_description(
            payload.title,
            payload.skills,
            payload.seniority,
            payload.employment_type,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service couldn't generate a description. Please try again.",
        )
    return JobDescriptionResponse(**result)


@router.get("", response_model=Page[JobRead])
async def list_jobs(
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    params: ListParamsDep,
    status: JobStatus | None = Query(None),
) -> Page[JobRead]:
    return await JobService(db).list(
        current_user, params.page_params, params.search, status
    )


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobRead:
    job = await JobService(db).create(data, created_by_id=current_user.id)
    return JobRead.model_validate(job)


@router.post("/bulk-delete", response_model=BulkResult)
async def bulk_delete_jobs(
    data: BulkIds,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BulkResult:
    service = JobService(db)
    deleted = 0
    for job_id in data.ids:
        try:
            await service.delete(job_id, current_user)
            deleted += 1
        except AppError:
            continue
    return BulkResult(deleted=deleted)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: int,
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobRead:
    return JobRead.model_validate(await JobService(db).get(job_id, current_user))


@router.patch("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: int,
    data: JobUpdate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobRead:
    job = await JobService(db).update(job_id, data, current_user)
    return JobRead.model_validate(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await JobService(db).delete(job_id, current_user)
