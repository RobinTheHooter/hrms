from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppError
from app.core.config import get_settings
from app.modules.auth.models import User
from app.modules.candidates.service import CandidateService
from app.modules.notifications.email_sender import send_email
from app.modules.notifications.models import EmailLog
from app.modules.notifications.templates import build_templates

settings = get_settings()


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def templates(self, candidate_id: int, user: User) -> dict:
        # Reuse candidate scoping/visibility rules.
        candidate = await CandidateService(self.db).get(candidate_id, user)
        return {
            "enabled": settings.email_enabled,
            "candidate_email": candidate.email,
            "templates": build_templates(candidate, candidate.job),
        }

    async def notify(
        self, candidate_id: int, subject: str, body: str, user: User
    ) -> None:
        candidate = await CandidateService(self.db).get(candidate_id, user)
        if not settings.email_enabled:
            raise AppError("Email is not configured on the server")

        try:
            await send_email(candidate.email, subject, body)
        except Exception as exc:  # noqa: BLE001
            raise AppError(f"Failed to send email: {exc}") from exc

        self.db.add(
            EmailLog(
                candidate_id=candidate.id,
                to_email=candidate.email,
                subject=subject,
                body=body,
                sent_by_id=user.id,
            )
        )
