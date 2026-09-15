from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import (
    OnboardingStatus,
    OnboardingTaskCategory,
    OnboardingTaskOwner,
    OnboardingTaskStatus,
)
from app.models.base import Base, TimestampMixin


class Onboarding(Base, TimestampMixin):
    """A new hire's onboarding journey — the bridge from an accepted offer
    (candidate stage "hired") to an active Employee record.

    Candidate/offer details are snapshotted at creation so the journey stays
    stable even if the source candidate row later changes or is removed.
    """

    __tablename__ = "onboarding"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Source candidate (one onboarding per candidate) + originating offer.
    candidate_id: Mapped[int | None] = mapped_column(
        ForeignKey("candidates.id", ondelete="SET NULL"), unique=True, index=True
    )
    offer_id: Mapped[int | None] = mapped_column(
        ForeignKey("offers.id", ondelete="SET NULL")
    )

    # Snapshot of who is joining.
    full_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), index=True)
    job_title: Mapped[str | None] = mapped_column(String(150))
    department: Mapped[str | None] = mapped_column(String(150))
    location: Mapped[str | None] = mapped_column(String(150))
    start_date: Mapped[date | None] = mapped_column(Date, index=True)

    manager_name: Mapped[str | None] = mapped_column(String(150))
    buddy_name: Mapped[str | None] = mapped_column(String(150))
    notes: Mapped[str | None] = mapped_column(Text)

    status: Mapped[OnboardingStatus] = mapped_column(
        SAEnum(OnboardingStatus, name="onboarding_status"),
        default=OnboardingStatus.PRE_JOINING,
        index=True,
    )

    # Set once the new hire is converted into an Employee.
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL")
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    tasks: Mapped[list["OnboardingTask"]] = relationship(
        "OnboardingTask",
        back_populates="onboarding",
        cascade="all, delete-orphan",
        order_by="OnboardingTask.position",
        lazy="selectin",
    )

    @property
    def task_total(self) -> int:
        return len(self.tasks)

    @property
    def task_done(self) -> int:
        return sum(1 for t in self.tasks if t.status == OnboardingTaskStatus.DONE)

    @property
    def progress(self) -> int:
        """Completion as a whole percentage (0–100)."""
        if not self.tasks:
            return 0
        return round(self.task_done / self.task_total * 100)


class OnboardingTask(Base, TimestampMixin):
    """A single checklist item within an onboarding journey."""

    __tablename__ = "onboarding_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    onboarding_id: Mapped[int] = mapped_column(
        ForeignKey("onboarding.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[OnboardingTaskCategory] = mapped_column(
        SAEnum(OnboardingTaskCategory, name="onboarding_task_category")
    )
    title: Mapped[str] = mapped_column(String(200))
    owner: Mapped[OnboardingTaskOwner | None] = mapped_column(
        SAEnum(OnboardingTaskOwner, name="onboarding_task_owner")
    )
    status: Mapped[OnboardingTaskStatus] = mapped_column(
        SAEnum(OnboardingTaskStatus, name="onboarding_task_status"),
        default=OnboardingTaskStatus.PENDING,
    )
    due_date: Mapped[date | None] = mapped_column(Date)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    position: Mapped[int] = mapped_column(Integer, default=0)

    onboarding: Mapped[Onboarding] = relationship(
        "Onboarding", back_populates="tasks"
    )


class OnboardingNotification(Base, TimestampMixin):
    """Audit + idempotency record for automated onboarding emails.

    The service checks for an existing (onboarding_id, kind, ref) row before
    sending, so scheduled reminders never double-send even if the sweep runs
    more than once a day or on more than one instance.
    """

    __tablename__ = "onboarding_notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    onboarding_id: Mapped[int] = mapped_column(
        ForeignKey("onboarding.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(50), index=True)
    to_email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(300))
    # Dedupe key for a given kind — e.g. a date ("2026-09-12") for daily
    # reminders, or a task id. NULL for one-off events (welcome/alert).
    ref: Mapped[str | None] = mapped_column(String(100))
