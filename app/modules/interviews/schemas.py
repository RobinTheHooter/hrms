from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import (
    InterviewMode,
    InterviewOutcome,
    InterviewStatus,
    Priority,
)


class _JobBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class InterviewCandidate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    job: _JobBrief | None


class PersonBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


class InterviewCreate(BaseModel):
    candidate_id: int
    hiring_manager_id: int | None = None
    mode: InterviewMode = InterviewMode.VIRTUAL
    scheduled_at: datetime
    location_or_link: str | None = Field(default=None, max_length=500)
    priority: Priority = Priority.MEDIUM
    notes: str | None = None


class InterviewUpdate(BaseModel):
    hiring_manager_id: int | None = None
    mode: InterviewMode | None = None
    scheduled_at: datetime | None = None
    location_or_link: str | None = Field(default=None, max_length=500)
    status: InterviewStatus | None = None
    priority: Priority | None = None
    notes: str | None = None


class InterviewFeedback(BaseModel):
    recommendation: str | None = None  # strong_yes | yes | no | strong_no
    ratings: dict[str, int] | None = None  # competency -> 1..5
    strengths: str | None = None
    concerns: str | None = None
    # Structured next step chosen by the hiring manager.
    next_step: str | None = None  # join | next_round | on_hold
    tentative_joining_date: str | None = None  # yyyy-mm-dd (when next_step == join)
    estimated_ctc: int | None = None  # when next_step == join
    next_step_note: str | None = None  # for next_round / on_hold


class InterviewOutcomeUpdate(BaseModel):
    outcome: InterviewOutcome
    notes: str | None = None
    feedback: InterviewFeedback | None = None


class InterviewFeedbackUpdate(BaseModel):
    """Standalone feedback edit — does not change status or outcome."""

    feedback: InterviewFeedback
    notes: str | None = None


class InterviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    candidate: InterviewCandidate | None
    hiring_manager_id: int | None
    hiring_manager: PersonBrief | None
    mode: InterviewMode
    scheduled_at: datetime
    location_or_link: str | None
    meeting_link: str | None
    status: InterviewStatus
    outcome: InterviewOutcome
    priority: Priority
    notes: str | None
    feedback: dict | None = None
    created_at: datetime
    updated_at: datetime
