from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import EmploymentType, JobStatus
from app.models.base import Base, TimestampMixin
from app.modules.auth.models import User


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    department: Mapped[str | None] = mapped_column(String(150))
    location: Mapped[str | None] = mapped_column(String(150))
    employment_type: Mapped[EmploymentType] = mapped_column(
        # Reuse the existing employment_type enum created by the employees table.
        SAEnum(EmploymentType, name="employment_type", create_type=False),
        default=EmploymentType.FULL_TIME,
    )
    positions: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str | None] = mapped_column(Text)
    # Comma/line separated skills the AI screening scores candidates against.
    required_skills: Mapped[str | None] = mapped_column(Text)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="job_status"), default=JobStatus.OPEN
    )

    assigned_consultant_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    assigned_consultant: Mapped[User | None] = relationship(
        "User", foreign_keys=[assigned_consultant_id], lazy="selectin"
    )
