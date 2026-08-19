from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import CandidateStage
from app.common.pagination import Page, PageParams
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.candidates.schemas import (
    CandidateCreate,
    CandidateRead,
    CandidateUpdate,
)
from app.modules.candidates.service import CandidateService
from app.modules.notifications.service import NotificationService
from app.modules.screening.service import ScreeningService

router = APIRouter(prefix="/candidates", tags=["candidates"])


class NotifyIn(BaseModel):
    subject: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1)

ViewUser = Annotated[User, Depends(require_permission(Permission.CANDIDATES_VIEW))]
ManageUser = Annotated[User, Depends(require_permission(Permission.CANDIDATES_MANAGE))]


@router.get("", response_model=Page[CandidateRead])
async def list_candidates(
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    stage: CandidateStage | None = Query(None),
    job_id: int | None = Query(None),
    min_score: int | None = Query(None, ge=0, le=100),
    sort: str | None = Query(None),
) -> Page[CandidateRead]:
    params = PageParams(page=page, size=size)
    return await CandidateService(db).list(
        current_user, params, search, stage, job_id, min_score, sort
    )


@router.post("", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    data: CandidateCreate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await CandidateService(db).create(data, current_user)
    return CandidateRead.model_validate(candidate)


@router.get("/{candidate_id}", response_model=CandidateRead)
async def get_candidate(
    candidate_id: int,
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await CandidateService(db).get(candidate_id, current_user)
    return CandidateRead.model_validate(candidate)


@router.patch("/{candidate_id}", response_model=CandidateRead)
async def update_candidate(
    candidate_id: int,
    data: CandidateUpdate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await CandidateService(db).update(candidate_id, data, current_user)
    return CandidateRead.model_validate(candidate)


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await CandidateService(db).delete(candidate_id, current_user)


@router.get("/{candidate_id}/email-templates")
async def candidate_email_templates(
    candidate_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await NotificationService(db).templates(candidate_id, current_user)


@router.post("/{candidate_id}/notify", status_code=status.HTTP_204_NO_CONTENT)
async def notify_candidate(
    candidate_id: int,
    data: NotifyIn,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await NotificationService(db).notify(
        candidate_id, data.subject, data.body, current_user
    )


@router.post("/{candidate_id}/resume", response_model=CandidateRead)
async def upload_resume(
    candidate_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
) -> CandidateRead:
    candidate = await ScreeningService(db).upload_resume(candidate_id, file, current_user)
    return CandidateRead.model_validate(candidate)


@router.post("/{candidate_id}/score", response_model=CandidateRead)
async def score_candidate(
    candidate_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await ScreeningService(db).score(candidate_id, current_user)
    return CandidateRead.model_validate(candidate)
