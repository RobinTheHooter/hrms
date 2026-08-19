from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.common.enums import CandidateSource, CandidateStage


class JobBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class CandidateBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    current_role: str | None = Field(default=None, max_length=150)
    experience_years: Decimal | None = Field(default=None, ge=0, le=80)
    skills: str | None = None
    source: CandidateSource = CandidateSource.APPLIED
    current_ctc: Decimal | None = Field(default=None, ge=0)
    expected_ctc: Decimal | None = Field(default=None, ge=0)
    notice_period_days: int | None = Field(default=None, ge=0, le=365)
    resume_url: str | None = Field(default=None, max_length=500)
    stage: CandidateStage = CandidateStage.APPLIED
    notes: str | None = None


class CandidateCreate(CandidateBase):
    job_id: int


class CandidateUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    current_role: str | None = Field(default=None, max_length=150)
    experience_years: Decimal | None = Field(default=None, ge=0, le=80)
    skills: str | None = None
    source: CandidateSource | None = None
    current_ctc: Decimal | None = Field(default=None, ge=0)
    expected_ctc: Decimal | None = Field(default=None, ge=0)
    notice_period_days: int | None = Field(default=None, ge=0, le=365)
    resume_url: str | None = Field(default=None, max_length=500)
    stage: CandidateStage | None = None
    notes: str | None = None


class CandidateRead(CandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    job: JobBrief | None
    email: str  # relax for read
    has_resume: bool = False
    ai_score: int | None = None
    ai_summary: str | None = None
    ai_matched: list[str] | None = None
    ai_missing: list[str] | None = None
    ai_scored_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
