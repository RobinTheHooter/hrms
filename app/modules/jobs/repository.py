from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import JobStatus
from app.common.pagination import PageParams
from app.modules.candidates.models import Candidate
from app.modules.jobs.models import Job


class JobRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, job_id: int) -> Job | None:
        return await self.db.get(Job, job_id)

    async def list(
        self,
        params: PageParams,
        *,
        search: str | None = None,
        status: JobStatus | None = None,
        consultant_id: int | None = None,
    ) -> tuple[list[Job], int]:
        stmt = select(Job)
        count_stmt = select(func.count()).select_from(Job)

        conditions = []
        if search:
            pattern = f"%{search}%"
            conditions.append(
                Job.title.ilike(pattern)
                | Job.department.ilike(pattern)
                | Job.location.ilike(pattern)
            )
        if status is not None:
            conditions.append(Job.status == status)
        if consultant_id is not None:
            conditions.append(Job.assigned_consultant_id == consultant_id)

        for c in conditions:
            stmt = stmt.where(c)
            count_stmt = count_stmt.where(c)

        stmt = stmt.order_by(Job.id.desc()).offset(params.offset).limit(params.size)
        items = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return list(items), total

    async def candidate_counts(self, job_ids: list[int]) -> dict[int, int]:
        """Number of candidates per job, for the given job ids."""
        if not job_ids:
            return {}
        stmt = (
            select(Candidate.job_id, func.count(Candidate.id))
            .where(Candidate.job_id.in_(job_ids))
            .group_by(Candidate.job_id)
        )
        rows = (await self.db.execute(stmt)).all()
        return {job_id: count for job_id, count in rows}

    async def create(self, job: Job) -> Job:
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def delete(self, job: Job) -> None:
        await self.db.delete(job)
        await self.db.flush()
