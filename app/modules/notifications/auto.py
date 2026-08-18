"""Best-effort automated candidate emails (never block the caller)."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.jobs.models import Job
from app.modules.notifications.email_sender import send_email
from app.modules.notifications.models import EmailLog
from app.modules.notifications.templates import build_templates

settings = get_settings()


async def send_candidate_template(
    db: AsyncSession, candidate, key: str, sent_by_id: int | None
) -> bool:
    """Send a named template to a candidate and log it. Returns success."""
    if not settings.email_enabled:
        return False

    job = await db.get(Job, candidate.job_id) if candidate.job_id else None
    template = next(
        (t for t in build_templates(candidate, job) if t["key"] == key), None
    )
    if template is None:
        return False

    try:
        await send_email(candidate.email, template["subject"], template["body"])
    except Exception:
        return False

    db.add(
        EmailLog(
            candidate_id=candidate.id,
            to_email=candidate.email,
            subject=template["subject"],
            body=template["body"],
            sent_by_id=sent_by_id,
        )
    )
    return True
