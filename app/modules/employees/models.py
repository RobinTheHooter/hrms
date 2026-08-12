from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import EmployeeStatus, EmploymentType
from app.models.base import Base, TimestampMixin


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    job_title: Mapped[str] = mapped_column(String(150))
    department: Mapped[str | None] = mapped_column(String(150))
    employment_type: Mapped[EmploymentType] = mapped_column(
        SAEnum(EmploymentType, name="employment_type"),
        default=EmploymentType.FULL_TIME,
    )
    status: Mapped[EmployeeStatus] = mapped_column(
        SAEnum(EmployeeStatus, name="employee_status"),
        default=EmployeeStatus.ACTIVE,
    )
    date_of_joining: Mapped[date] = mapped_column(Date)
    salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))

    # Optional link to an auth User (for login access).
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), unique=True
    )
