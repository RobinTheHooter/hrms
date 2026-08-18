from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import CandidateSource, CandidateStage
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

    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    job: Mapped[Job] = relationship("Job", lazy="selectin")
