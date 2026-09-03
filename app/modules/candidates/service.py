from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission, role_has_permission
from app.common.enums import CandidateStage, UserRole
from app.common.exceptions import NotFoundError, PermissionError
from app.common.pagination import Page, PageParams
from app.core.config import get_settings
from app.core.tasks import enqueue
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.candidates.repository import CandidateRepository
from app.modules.candidates.schemas import (
    CandidateCreate,
    CandidateRead,
    CandidateUpdate,
)
from app.modules.jobs.models import Job
from app.modules.notifications.tasks import send_candidate_template_bg

settings = get_settings()

# Hiring decisions — reserved for HR/admin (anyone with CANDIDATES_DECIDE).
DECISION_STAGES = {
    CandidateStage.OFFER,
    CandidateStage.HIRED,
    CandidateStage.REJECTED,
}


class CandidateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CandidateRepository(db)

    @staticmethod
    def _consultant_scope(user: User) -> int | None:
        """Consultants are limited to their assigned jobs; others see all."""
        return user.id if user.role == UserRole.CONSULTANT else None

    async def _job_or_404(self, job_id: int) -> Job:
        job = await self.db.get(Job, job_id)
        if job is None:
            raise NotFoundError("Job not found")
        return job

    def _assert_can_touch_job(self, job: Job, user: User) -> None:
        if (
            user.role == UserRole.CONSULTANT
            and job.assigned_consultant_id != user.id
        ):
            raise PermissionError("This job is not assigned to you")

    async def list(
        self,
        user: User,
        params: PageParams,
        search: str | None = None,
        stage: CandidateStage | None = None,
        source=None,
        job_id: int | None = None,
        min_score: int | None = None,
        sort: str | None = None,
    ) -> Page[CandidateRead]:
        items, total = await self.repo.paginate(
            params,
            search=search,
            stage=stage,
            source=source,
            job_id=job_id,
            consultant_id=self._consultant_scope(user),
            min_score=min_score,
            sort=sort,
        )
        return Page.create(
            items=[CandidateRead.model_validate(c) for c in items],
            total=total,
            params=params,
        )

    async def get(self, candidate_id: int, user: User) -> Candidate:
        candidate = await self.repo.get_by_id(candidate_id)
        if candidate is None:
            raise NotFoundError("Candidate not found")
        if (
            user.role == UserRole.CONSULTANT
            and candidate.job.assigned_consultant_id != user.id
        ):
            raise NotFoundError("Candidate not found")
        return candidate

    def _assert_can_set_stage(self, stage, user: User) -> None:
        """Offer/hired/rejected are hiring decisions — only users with the
        decide permission (HR/admin) may move a candidate there; never
        consultants."""
        if stage in DECISION_STAGES and not role_has_permission(
            user.role, Permission.CANDIDATES_DECIDE
        ):
            raise PermissionError(
                "Only HR can move a candidate to offer, hired or rejected."
            )

    async def create(self, data: CandidateCreate, user: User) -> Candidate:
        job = await self._job_or_404(data.job_id)
        self._assert_can_touch_job(job, user)
        self._assert_can_set_stage(data.stage, user)
        candidate = Candidate(
            **data.model_dump(exclude={"send_ack"}), created_by_id=user.id
        )
        candidate = await self.repo.create(candidate)

        # Acknowledge new applicants in the background (best-effort). Sending is
        # opt-in per submission (send_ack) and only for new applications.
        if (
            settings.email_enabled
            and data.send_ack
            and candidate.stage == CandidateStage.APPLIED
        ):
            await self.db.commit()
            enqueue(
                send_candidate_template_bg,
                candidate.id,
                "application_received",
                user.id,
            )
        return candidate

    async def update(
        self, candidate_id: int, data: CandidateUpdate, user: User
    ) -> Candidate:
        candidate = await self.get(candidate_id, user)
        fields = data.model_dump(exclude_unset=True)
        if "stage" in fields:
            self._assert_can_set_stage(fields["stage"], user)
        for field, value in fields.items():
            setattr(candidate, field, value)
        return candidate

    async def delete(self, candidate_id: int, user: User) -> None:
        candidate = await self.get(candidate_id, user)
        await self.repo.delete(candidate)
