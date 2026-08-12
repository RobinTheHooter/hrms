from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.common.enums import EmployeeStatus, EmploymentType


class EmployeeBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    job_title: str = Field(min_length=1, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    date_of_joining: date
    salary: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    user_id: int | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    job_title: str | None = Field(default=None, min_length=1, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    employment_type: EmploymentType | None = None
    status: EmployeeStatus | None = None
    date_of_joining: date | None = None
    salary: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    user_id: int | None = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
