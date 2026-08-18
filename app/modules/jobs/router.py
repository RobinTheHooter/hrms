from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import JobStatus
from app.common.pagination import Page, PageParams
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.jobs.schemas import JobCreate, JobRead, JobUpdate
from app.modules.jobs.service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])

# These dependencies both enforce the permission and return the current user.
ViewUser = Annotated[User, Depends(require_permission(Permission.JOBS_VIEW))]
ManageUser = Annotated[User, Depends(require_permission(Permission.JOBS_MANAGE))]


@router.get("", response_model=Page[JobRead])
async def list_jobs(
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: JobStatus | None = Query(None),
) -> Page[JobRead]:
    params = PageParams(page=page, size=size)
    return await JobService(db).list(current_user, params, search, status)


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobRead:
    job = await JobService(db).create(data, created_by_id=current_user.id)
    return JobRead.model_validate(job)


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
