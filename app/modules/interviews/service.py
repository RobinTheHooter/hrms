from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    CandidateStage,
    InterviewOutcome,
    InterviewStatus,
    UserRole,
)
from app.common.exceptions import NotFoundError, PermissionError
from app.common.pagination import Page, PageParams
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.interviews.models import Interview
from app.modules.interviews.repository import InterviewRepository
from app.modules.interviews.schemas import (
    InterviewCreate,
    InterviewOutcomeUpdate,
    InterviewRead,
    InterviewUpdate,
)


class InterviewService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = InterviewRepository(db)

    @staticmethod
    def _scope(user: User) -> tuple[int | None, int | None]:
        """(consultant_id, manager_id) filters based on role."""
        if user.role == UserRole.CONSULTANT:
            return user.id, None
        if user.role == UserRole.HIRING_MANAGER:
            return None, user.id
        return None, None  # hr / admin see all

    def _assert_visible(self, interview: Interview, user: User) -> None:
        if (
            user.role == UserRole.CONSULTANT
            and interview.candidate.job.assigned_consultant_id != user.id
        ):
            raise NotFoundError("Interview not found")
        if (
            user.role == UserRole.HIRING_MANAGER
            and interview.hiring_manager_id != user.id
        ):
            raise NotFoundError("Interview not found")

    async def list(
        self,
        user: User,
        params: PageParams,
        status: InterviewStatus | None = None,
    ) -> Page[InterviewRead]:
        consultant_id, manager_id = self._scope(user)
        items, total = await self.repo.list(
            params, status=status, consultant_id=consultant_id, manager_id=manager_id
        )
        return Page.create(
            items=[InterviewRead.model_validate(i) for i in items],
            total=total,
            params=params,
        )

    async def get(self, interview_id: int, user: User) -> Interview:
        interview = await self.repo.get_by_id(interview_id)
        if interview is None:
            raise NotFoundError("Interview not found")
        self._assert_visible(interview, user)
        return interview

    async def create(self, data: InterviewCreate, user: User) -> Interview:
        candidate = await self.db.get(Candidate, data.candidate_id)
        if candidate is None:
            raise NotFoundError("Candidate not found")
        # Consultants may only schedule for candidates on their assigned jobs.
        if (
            user.role == UserRole.CONSULTANT
            and candidate.job.assigned_consultant_id != user.id
        ):
            raise PermissionError("This candidate is not on your job")

        interview = Interview(**data.model_dump(), created_by_id=user.id)
        interview = await self.repo.create(interview)

        # Move the candidate into the interview stage.
        if candidate.stage in (CandidateStage.APPLIED, CandidateStage.SCREENING):
            candidate.stage = CandidateStage.INTERVIEW
        return interview

    async def update(
        self, interview_id: int, data: InterviewUpdate, user: User
    ) -> Interview:
        interview = await self.get(interview_id, user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(interview, field, value)
        return interview

    async def record_outcome(
        self, interview_id: int, data: InterviewOutcomeUpdate, user: User
    ) -> Interview:
        interview = await self.get(interview_id, user)
        interview.outcome = data.outcome
        interview.status = InterviewStatus.COMPLETED
        if data.notes is not None:
            interview.notes = data.notes

        # Reflect the outcome back onto the candidate's pipeline stage.
        candidate = interview.candidate
        if data.outcome == InterviewOutcome.SELECTED:
            candidate.stage = CandidateStage.OFFER
        elif data.outcome == InterviewOutcome.REJECTED:
            candidate.stage = CandidateStage.REJECTED
        return interview

    async def delete(self, interview_id: int, user: User) -> None:
        interview = await self.get(interview_id, user)
        await self.repo.delete(interview)
