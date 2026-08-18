from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import JobStatus
from app.common.pagination import PageParams
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

    async def create(self, job: Job) -> Job:
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def delete(self, job: Job) -> None:
        await self.db.delete(job)
        await self.db.flush()
