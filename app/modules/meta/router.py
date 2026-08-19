"""Serves enum options so the frontend never hardcodes dropdown values.

The backend is the single source of truth for every selectable option.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    CandidateSource,
    CandidateStage,
    EmploymentType,
    InterviewMode,
    InterviewOutcome,
    InterviewStatus,
    JobStatus,
    Priority,
    UserRole,
)
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter(
    prefix="/meta",
    tags=["meta"],
    dependencies=[Depends(get_current_user)],
)

# Human labels; anything not listed is derived by title-casing the value.
_LABELS = {
    "full_time": "Full-time",
    "part_time": "Part-time",
    "hr": "HR Admin",
    "hiring_manager": "Hiring Manager",
    "wfh": "WFH",
}


class Option(BaseModel):
    value: str
    label: str


class OptionsResponse(BaseModel):
    employment_types: list[Option]
    job_statuses: list[Option]
    candidate_sources: list[Option]
    candidate_stages: list[Option]
    interview_modes: list[Option]
    interview_statuses: list[Option]
    interview_outcomes: list[Option]
    priorities: list[Option]
    user_roles: list[Option]


def _label(value: str) -> str:
    return _LABELS.get(value, value.replace("_", " ").title())


def _options(members) -> list[Option]:
    return [Option(value=m.value, label=_label(m.value)) for m in members]


@router.get("/options", response_model=OptionsResponse)
async def get_options() -> OptionsResponse:
    return OptionsResponse(
        employment_types=_options(EmploymentType),
        job_statuses=_options(JobStatus),
        candidate_sources=_options(CandidateSource),
        candidate_stages=_options(CandidateStage),
        interview_modes=_options(InterviewMode),
        interview_statuses=_options(InterviewStatus),
        interview_outcomes=_options(InterviewOutcome),
        priorities=_options(Priority),
        # Only the assignable ATS roles (legacy manager/employee excluded).
        user_roles=_options(
            [
                UserRole.ADMIN,
                UserRole.HR,
                UserRole.CONSULTANT,
                UserRole.HIRING_MANAGER,
                UserRole.CANDIDATE,
            ]
        ),
    )


class PersonBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


@router.get("/users", response_model=list[PersonBrief])
async def assignable_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    role: UserRole = Query(...),
) -> list[PersonBrief]:
    """Minimal (id, name) list of active users for a role — for pickers."""
    result = await db.execute(
        select(User.id, User.full_name)
        .where(User.role == role, User.is_active.is_(True))
        .order_by(User.full_name)
    )
    return [PersonBrief(id=r.id, full_name=r.full_name) for r in result]
