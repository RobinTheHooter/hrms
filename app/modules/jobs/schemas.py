from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import EmploymentType, JobStatus


class ConsultantBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=150)
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    positions: int = Field(default=1, ge=1, le=999)
    description: str | None = None
    status: JobStatus = JobStatus.OPEN
    assigned_consultant_id: int | None = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=150)
    employment_type: EmploymentType | None = None
    positions: int | None = Field(default=None, ge=1, le=999)
    description: str | None = None
    status: JobStatus | None = None
    assigned_consultant_id: int | None = None


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    department: str | None
    location: str | None
    employment_type: EmploymentType
    positions: int
    description: str | None
    status: JobStatus
    assigned_consultant_id: int | None
    assigned_consultant: ConsultantBrief | None
    created_at: datetime
    updated_at: datetime
