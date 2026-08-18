"""Serves enum options so the frontend never hardcodes dropdown values.

The backend is the single source of truth for every selectable option.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.common.enums import (
    CandidateSource,
    CandidateStage,
    EmploymentType,
    JobStatus,
    UserRole,
)
from app.modules.auth.dependencies import get_current_user

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
