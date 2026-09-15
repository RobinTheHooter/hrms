"""Daily onboarding reminder sweep.

`run_onboarding_reminders` is pure of scheduling concerns — it just does one
pass over active onboardings and sends any due reminders (idempotently). It is
driven by the in-app scheduler wired up in main.py (APScheduler), so no
external cron is required.
"""
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    OnboardingStatus,
    OnboardingTaskOwner,
    OnboardingTaskStatus,
)
from app.core.config import get_settings
from app.modules.onboarding import notifications
from app.modules.onboarding.models import Onboarding

settings = get_settings()
logger = logging.getLogger("hrms.onboarding")

_INACTIVE = {OnboardingStatus.COMPLETED, OnboardingStatus.CANCELLED}


async def run_onboarding_reminders(db: AsyncSession) -> dict:
    """One reminder pass. Returns a summary of what was sent."""
    today = datetime.now(ZoneInfo(settings.APP_TIMEZONE)).date()

    onboardings = list(
        (
            await db.execute(
                select(Onboarding).where(Onboarding.status.notin_(_INACTIVE))
            )
        )
        .scalars()
        .all()
    )

    doc_reminders = 0
    overdue_rows: list[tuple[Onboarding, list]] = []

    for onboarding in onboardings:
        # Pre-joining document nudge to the new hire.
        if onboarding.start_date is not None:
            days = (onboarding.start_date - today).days
            if 0 <= days <= settings.ONBOARDING_DOC_REMINDER_DAYS:
                pending = [
                    t
                    for t in onboarding.tasks
                    if t.owner == OnboardingTaskOwner.NEW_HIRE
                    and t.status != OnboardingTaskStatus.DONE
                ]
                if pending and await notifications.send_doc_reminder(
                    db, onboarding, pending
                ):
                    doc_reminders += 1

        # Collect overdue tasks for the internal digest.
        overdue = [
            t
            for t in onboarding.tasks
            if t.due_date is not None
            and t.due_date < today
            and t.status != OnboardingTaskStatus.DONE
        ]
        if overdue:
            overdue_rows.append((onboarding, overdue))

    digest_sent = await notifications.send_overdue_digest(
        db, overdue_rows, ref=today.isoformat()
    )

    summary = {
        "date": today.isoformat(),
        "active_onboardings": len(onboardings),
        "doc_reminders_sent": doc_reminders,
        "overdue_onboardings": len(overdue_rows),
        "overdue_digest_sent": bool(digest_sent),
    }
    logger.info("Onboarding reminder sweep: %s", summary)
    return summary
