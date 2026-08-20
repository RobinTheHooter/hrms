"""Background notification jobs (run via app.core.tasks.enqueue)."""
import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.tasks import run_with_session
from app.modules.candidates.models import Candidate
from app.modules.notifications.auto import send_candidate_template

logger = logging.getLogger("hrms.notifications")


async def send_candidate_template_bg(
    candidate_id: int, key: str, sent_by_id: int | None
) -> None:
    """Send an automated candidate template email in its own session."""

    async def work(session) -> None:
        candidate = (
            await session.execute(
                select(Candidate)
                .where(Candidate.id == candidate_id)
                .options(selectinload(Candidate.job))
            )
        ).scalar_one_or_none()
        if candidate is None:
            return
        await send_candidate_template(session, candidate, key, sent_by_id)

    await run_with_session(work)
