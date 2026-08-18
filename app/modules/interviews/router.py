from datetime import date as date_type, datetime, time
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.enums import InterviewStatus
from app.common.pagination import Page, PageParams
from app.core.config import get_settings
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.integrations.calendar import GoogleCalendarService
from app.modules.interviews.schemas import (
    InterviewCreate,
    InterviewOutcomeUpdate,
    InterviewRead,
    InterviewUpdate,
)
from app.modules.interviews.service import InterviewService

settings = get_settings()

router = APIRouter(prefix="/interviews", tags=["interviews"])

ViewUser = Annotated[User, Depends(require_permission(Permission.INTERVIEWS_VIEW))]
ScheduleUser = Annotated[
    User, Depends(require_permission(Permission.INTERVIEWS_SCHEDULE))
]
ConductUser = Annotated[
    User, Depends(require_permission(Permission.INTERVIEWS_CONDUCT))
]


@router.get("", response_model=Page[InterviewRead])
async def list_interviews(
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: InterviewStatus | None = Query(None),
) -> Page[InterviewRead]:
    params = PageParams(page=page, size=size)
    return await InterviewService(db).list(current_user, params, status)


@router.post("", response_model=InterviewRead, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    data: InterviewCreate,
    current_user: ScheduleUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InterviewRead:
    interview = await InterviewService(db).create(data, current_user)
    return InterviewRead.model_validate(interview)


@router.get("/availability")
async def availability(
    current_user: ScheduleUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    manager_id: int = Query(...),
    day: date_type = Query(..., alias="date"),
) -> dict:
    """A hiring manager's busy blocks for a day (IST), from Google FreeBusy."""
    tz = ZoneInfo(settings.APP_TIMEZONE)
    start = datetime.combine(day, time(0, 0), tzinfo=tz)
    end = datetime.combine(day, time(23, 59, 59), tzinfo=tz)
    busy = await GoogleCalendarService(db).free_busy(
        manager_id, start.isoformat(), end.isoformat(), settings.APP_TIMEZONE
    )
    return {"connected": busy is not None, "busy": busy or []}


@router.get("/{interview_id}", response_model=InterviewRead)
async def get_interview(
    interview_id: int,
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InterviewRead:
    interview = await InterviewService(db).get(interview_id, current_user)
    return InterviewRead.model_validate(interview)


@router.patch("/{interview_id}", response_model=InterviewRead)
async def update_interview(
    interview_id: int,
    data: InterviewUpdate,
    current_user: ScheduleUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InterviewRead:
    interview = await InterviewService(db).update(interview_id, data, current_user)
    return InterviewRead.model_validate(interview)


@router.patch("/{interview_id}/outcome", response_model=InterviewRead)
async def record_outcome(
    interview_id: int,
    data: InterviewOutcomeUpdate,
    current_user: ConductUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InterviewRead:
    interview = await InterviewService(db).record_outcome(
        interview_id, data, current_user
    )
    return InterviewRead.model_validate(interview)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int,
    current_user: ScheduleUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await InterviewService(db).delete(interview_id, current_user)
