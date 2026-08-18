from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import InterviewStatus
from app.common.pagination import PageParams
from app.modules.candidates.models import Candidate
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job


class InterviewRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, interview_id: int) -> Interview | None:
        return await self.db.get(Interview, interview_id)

    async def list(
        self,
        params: PageParams,
        *,
        status: InterviewStatus | None = None,
        consultant_id: int | None = None,
        manager_id: int | None = None,
    ) -> tuple[list[Interview], int]:
        stmt = select(Interview)
        count_stmt = select(func.count()).select_from(Interview)

        # Consultants: only interviews for candidates on their assigned jobs.
        if consultant_id is not None:
            stmt = stmt.join(Candidate, Interview.candidate_id == Candidate.id).join(
                Job, Candidate.job_id == Job.id
            )
            count_stmt = count_stmt.join(
                Candidate, Interview.candidate_id == Candidate.id
            ).join(Job, Candidate.job_id == Job.id)
            stmt = stmt.where(Job.assigned_consultant_id == consultant_id)
            count_stmt = count_stmt.where(Job.assigned_consultant_id == consultant_id)

        # Hiring managers: only their own interviews.
        if manager_id is not None:
            stmt = stmt.where(Interview.hiring_manager_id == manager_id)
            count_stmt = count_stmt.where(Interview.hiring_manager_id == manager_id)

        if status is not None:
            stmt = stmt.where(Interview.status == status)
            count_stmt = count_stmt.where(Interview.status == status)

        stmt = (
            stmt.order_by(Interview.scheduled_at.desc())
            .offset(params.offset)
            .limit(params.size)
        )
        items = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return list(items), total

    async def create(self, interview: Interview) -> Interview:
        self.db.add(interview)
        await self.db.flush()
        await self.db.refresh(interview)
        return interview

    async def delete(self, interview: Interview) -> None:
        await self.db.delete(interview)
        await self.db.flush()
