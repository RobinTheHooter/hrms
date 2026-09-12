from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import (
    EmploymentType,
    OnboardingStatus,
    OnboardingTaskCategory,
    OnboardingTaskOwner,
    OnboardingTaskStatus,
)


class OnboardingTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: OnboardingTaskCategory
    title: str
    owner: OnboardingTaskOwner | None
    status: OnboardingTaskStatus
    due_date: date | None
    completed_at: datetime | None
    position: int


class OnboardingTaskCreate(BaseModel):
    category: OnboardingTaskCategory
    title: str = Field(min_length=1, max_length=200)
    owner: OnboardingTaskOwner | None = None
    due_date: date | None = None


class OnboardingTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    category: OnboardingTaskCategory | None = None
    owner: OnboardingTaskOwner | None = None
    status: OnboardingTaskStatus | None = None
    due_date: date | None = None


class OnboardingBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=1, max_length=255)
    job_title: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=150)
    start_date: date | None = None
    manager_name: str | None = Field(default=None, max_length=150)
    buddy_name: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class OnboardingCreate(OnboardingBase):
    # Optionally seed from an existing candidate; otherwise a manual entry.
    candidate_id: int | None = None
    offer_id: int | None = None
    # Seed the default checklist template (documents, IT, HR, orientation).
    seed_default_tasks: bool = True


class OnboardingUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    email: str | None = Field(default=None, min_length=1, max_length=255)
    job_title: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=150)
    start_date: date | None = None
    manager_name: str | None = Field(default=None, max_length=150)
    buddy_name: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class OnboardingStatusUpdate(BaseModel):
    status: OnboardingStatus


class OnboardingConvert(BaseModel):
    """Fields needed to create the Employee record on conversion."""

    date_of_joining: date | None = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    job_title: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)


class OnboardingListRead(BaseModel):
    """Lightweight row for the list view (no full task list)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    job_title: str | None
    department: str | None
    start_date: date | None
    status: OnboardingStatus
    manager_name: str | None
    buddy_name: str | None
    employee_id: int | None
    task_total: int
    task_done: int
    progress: int
    created_at: datetime
    updated_at: datetime


class OnboardingRead(OnboardingListRead):
    """Full record with the task checklist."""

    candidate_id: int | None
    offer_id: int | None
    location: str | None
    notes: str | None
    tasks: list[OnboardingTaskRead]
