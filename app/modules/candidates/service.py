from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import CandidateStage, UserRole
from app.common.exceptions import NotFoundError, PermissionError
from app.common.pagination import Page, PageParams
from app.core.config import get_settings
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.candidates.repository import CandidateRepository
from app.modules.candidates.schemas import (
    CandidateCreate,
    CandidateRead,
    CandidateUpdate,
)
from app.modules.jobs.models import Job
from app.modules.notifications.auto import send_candidate_template

settings = get_settings()


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
        job_id: int | None = None,
    ) -> Page[CandidateRead]:
        items, total = await self.repo.list(
            params,
            search=search,
            stage=stage,
            job_id=job_id,
            consultant_id=self._consultant_scope(user),
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

    async def create(self, data: CandidateCreate, user: User) -> Candidate:
        job = await self._job_or_404(data.job_id)
        self._assert_can_touch_job(job, user)
        candidate = Candidate(**data.model_dump(), created_by_id=user.id)
        candidate = await self.repo.create(candidate)

        # Auto-acknowledge new applicants (best-effort, config-gated).
        if (
            settings.email_enabled
            and settings.AUTO_EMAIL_APPLICATION_RECEIVED
            and candidate.stage == CandidateStage.APPLIED
        ):
            await send_candidate_template(
                self.db, candidate, "application_received", user.id
            )
        return candidate

    async def update(
        self, candidate_id: int, data: CandidateUpdate, user: User
    ) -> Candidate:
        candidate = await self.get(candidate_id, user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(candidate, field, value)
        return candidate

    async def delete(self, candidate_id: int, user: User) -> None:
        candidate = await self.get(candidate_id, user)
        await self.repo.delete(candidate)
