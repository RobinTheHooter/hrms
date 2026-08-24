from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.exceptions import AppError, NotFoundError
from app.common.schemas import BulkIds, BulkResult
from app.common.enums import CandidateSource, CandidateStage
from app.common.pagination import Page
from app.common.query import ListParamsDep
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
    params: ListParamsDep,
    stage: CandidateStage | None = Query(None),
    source: CandidateSource | None = Query(None),
    job_id: int | None = Query(None),
    min_score: int | None = Query(None, ge=0, le=100),
) -> Page[CandidateRead]:
    return await CandidateService(db).list(
        current_user,
        params.page_params,
        params.search,
        stage,
        source,
        job_id,
        min_score,
        params.sort,
    )


@router.post("", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    data: CandidateCreate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await CandidateService(db).create(data, current_user)
    return CandidateRead.model_validate(candidate)


@router.post("/bulk-delete", response_model=BulkResult)
async def bulk_delete_candidates(
    data: BulkIds,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BulkResult:
    service = CandidateService(db)
    deleted = 0
    for candidate_id in data.ids:
        try:
            await service.delete(candidate_id, current_user)
            deleted += 1
        except AppError:
            continue
    return BulkResult(deleted=deleted)


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


@router.get("/{candidate_id}/resume/file")
async def download_resume(
    candidate_id: int,
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    candidate = await CandidateService(db).get(candidate_id, current_user)
    if not candidate.resume_data:
        raise NotFoundError("No resume file for this candidate")
    filename = candidate.resume_filename or f"resume-{candidate.id}"
    return Response(
        content=candidate.resume_data,
        media_type=candidate.resume_mime or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.post("/{candidate_id}/score", response_model=CandidateRead)
async def score_candidate(
    candidate_id: int,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CandidateRead:
    candidate = await ScreeningService(db).score(candidate_id, current_user)
    return CandidateRead.model_validate(candidate)
