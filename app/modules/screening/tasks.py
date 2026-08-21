"""Background screening jobs (run via app.core.tasks.enqueue)."""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.tasks import run_with_session
from app.modules.candidates.models import Candidate
from app.modules.screening.ai import score_resume

settings = get_settings()
logger = logging.getLogger("hrms.screening")


async def screen_candidate(candidate_id: int) -> None:
    """AI-screen a candidate's stored resume and persist the result.

    Runs in its own session. Safe to enqueue right after the resume is
    committed; the frontend polls and shows the score once it lands.
    """
    if not (settings.AUTO_AI_SCREENING and settings.ai_enabled):
        return

    async def work(session) -> None:
        candidate = (
            await session.execute(
                select(Candidate)
                .where(Candidate.id == candidate_id)
                .options(selectinload(Candidate.job))
            )
        ).scalar_one_or_none()
        if candidate is None or not candidate.resume_text:
            return

        job = candidate.job
        required = (job.required_skills or job.description) if job else None
        result = await score_resume(
            required, job.title if job else "", candidate.resume_text
        )
        candidate.ai_score = result["score"]
        candidate.ai_summary = result["summary"]
        candidate.ai_matched = result["matched"]
        candidate.ai_missing = result["missing"]
        candidate.ai_scored_at = datetime.utcnow()

    await run_with_session(work)
