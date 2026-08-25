from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import CandidateSource, CandidateStage
from app.common.pagination import PageParams
from app.modules.candidates.models import Candidate
from app.modules.jobs.models import Job


class CandidateRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, candidate_id: int) -> Candidate | None:
        return await self.db.get(Candidate, candidate_id)

    async def paginate(
        self,
        params: PageParams,
        *,
        search: str | None = None,
        stage: CandidateStage | None = None,
        source: CandidateSource | None = None,
        job_id: int | None = None,
        consultant_id: int | None = None,
        min_score: int | None = None,
        sort: str | None = None,
    ) -> tuple[list[Candidate], int]:
        stmt = select(Candidate)
        count_stmt = select(func.count()).select_from(Candidate)

        # Consultants only see candidates on jobs assigned to them.
        if consultant_id is not None:
            stmt = stmt.join(Job, Candidate.job_id == Job.id)
            count_stmt = count_stmt.join(Job, Candidate.job_id == Job.id)
            stmt = stmt.where(Job.assigned_consultant_id == consultant_id)
            count_stmt = count_stmt.where(Job.assigned_consultant_id == consultant_id)

        if search:
            pattern = f"%{search}%"
            cond = Candidate.full_name.ilike(pattern) | Candidate.email.ilike(pattern)
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)
        if stage is not None:
            stmt = stmt.where(Candidate.stage == stage)
            count_stmt = count_stmt.where(Candidate.stage == stage)
        if source is not None:
            stmt = stmt.where(Candidate.source == source)
            count_stmt = count_stmt.where(Candidate.source == source)
        if job_id is not None:
            stmt = stmt.where(Candidate.job_id == job_id)
            count_stmt = count_stmt.where(Candidate.job_id == job_id)
        if min_score is not None:
            stmt = stmt.where(Candidate.ai_score >= min_score)
            count_stmt = count_stmt.where(Candidate.ai_score >= min_score)

        order = (
            Candidate.ai_score.desc().nullslast()
            if sort == "score"
            else Candidate.id.desc()
        )
        stmt = stmt.order_by(order).offset(params.offset).limit(params.size)
        items = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return list(items), total

    async def create(self, candidate: Candidate) -> Candidate:
        self.db.add(candidate)
        await self.db.flush()
        await self.db.refresh(candidate)
        return candidate

    async def delete(self, candidate: Candidate) -> None:
        await self.db.delete(candidate)
        await self.db.flush()
