from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import (
    InterviewMode,
    InterviewOutcome,
    InterviewStatus,
    Priority,
)
from app.models.base import Base, TimestampMixin
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate


class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"), index=True
    )
    hiring_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    mode: Mapped[InterviewMode] = mapped_column(
        SAEnum(InterviewMode, name="interview_mode"), default=InterviewMode.VIRTUAL
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    location_or_link: Mapped[str | None] = mapped_column(String(500))
    # Populated when synced to Google Calendar.
    google_event_id: Mapped[str | None] = mapped_column(String(255))
    meeting_link: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[InterviewStatus] = mapped_column(
        SAEnum(InterviewStatus, name="interview_status"),
        default=InterviewStatus.SCHEDULED,
        index=True,
    )
    outcome: Mapped[InterviewOutcome] = mapped_column(
        SAEnum(InterviewOutcome, name="interview_outcome"),
        default=InterviewOutcome.PENDING,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority", create_type=False),
        default=Priority.MEDIUM,
    )

    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    candidate: Mapped[Candidate] = relationship("Candidate", lazy="selectin")
    hiring_manager: Mapped[User | None] = relationship(
        "User", foreign_keys=[hiring_manager_id], lazy="selectin"
    )
