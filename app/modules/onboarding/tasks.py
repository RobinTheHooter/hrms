"""Background onboarding jobs (run via app.core.tasks.enqueue)."""
import asyncio
import logging

from sqlalchemy import select

from app.core.tasks import run_with_session
from app.modules.onboarding import notifications
from app.modules.onboarding.models import Onboarding

logger = logging.getLogger("hrms.onboarding")


async def notify_onboarding_started_bg(onboarding_id: int) -> None:
    """Send the new-hire welcome + internal alert once onboarding is created.

    Enqueued from the request path, so the creating transaction may not have
    committed yet — retry briefly until the row is visible in a fresh session.
    """
    async def work(session) -> None:
        onboarding = None
        for attempt in range(4):
            onboarding = (
                await session.execute(
                    select(Onboarding).where(Onboarding.id == onboarding_id)
                )
            ).scalar_one_or_none()
            if onboarding is not None:
                break
            await asyncio.sleep(0.5)
        if onboarding is None:
            logger.info("Onboarding %s not visible yet; skipping emails", onboarding_id)
            return
        await notifications.send_welcome(session, onboarding)
        await notifications.send_internal_alert(session, onboarding)

    await run_with_session(work)
