from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    LargeBinary,
    Numeric,
    String,
    Text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import CandidateSource, CandidateStage, Priority
from app.models.base import Base, TimestampMixin
from app.modules.jobs.models import Job


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), index=True
    )

    full_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    current_role: Mapped[str | None] = mapped_column(String(150))
    experience_years: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    skills: Mapped[str | None] = mapped_column(Text)
    source: Mapped[CandidateSource] = mapped_column(
        SAEnum(CandidateSource, name="candidate_source"),
        default=CandidateSource.APPLIED,
    )
    current_ctc: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    expected_ctc: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    notice_period_days: Mapped[int | None] = mapped_column(Integer)
    resume_url: Mapped[str | None] = mapped_column(String(500))
    stage: Mapped[CandidateStage] = mapped_column(
        SAEnum(CandidateStage, name="candidate_stage"),
        default=CandidateStage.APPLIED,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority", create_type=False),
        default=Priority.MEDIUM,
    )

    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    # Uploaded resume file (stored in DB) + extracted text + AI results.
    resume_filename: Mapped[str | None] = mapped_column(String(255))
    resume_mime: Mapped[str | None] = mapped_column(String(120))
    resume_data: Mapped[bytes | None] = mapped_column(LargeBinary)
    resume_text: Mapped[str | None] = mapped_column(Text)
    ai_score: Mapped[int | None] = mapped_column(Integer)
    ai_summary: Mapped[str | None] = mapped_column(Text)
    ai_matched: Mapped[list | None] = mapped_column(JSON)
    ai_missing: Mapped[list | None] = mapped_column(JSON)
    ai_scored_at: Mapped[datetime | None] = mapped_column(DateTime)

    job: Mapped[Job] = relationship("Job", lazy="selectin")

    @property
    def has_resume(self) -> bool:
        return bool(self.resume_text)

    @property
    def has_resume_file(self) -> bool:
        return self.resume_data is not None
