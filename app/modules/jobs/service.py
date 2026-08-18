from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission, role_has_permission
from app.common.enums import JobStatus
from app.common.exceptions import NotFoundError
from app.common.pagination import Page, PageParams
from app.modules.auth.models import User
from app.modules.jobs.models import Job
from app.modules.jobs.repository import JobRepository
from app.modules.jobs.schemas import JobCreate, JobRead, JobUpdate


class JobService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = JobRepository(db)

    @staticmethod
    def _can_manage(user: User) -> bool:
        return role_has_permission(user.role, Permission.JOBS_MANAGE)

    async def list(
        self,
        user: User,
        params: PageParams,
        search: str | None = None,
        status: JobStatus | None = None,
    ) -> Page[JobRead]:
        # Managers (HR/admin) see all; consultants see only their assigned jobs.
        consultant_id = None if self._can_manage(user) else user.id
        items, total = await self.repo.list(
            params, search=search, status=status, consultant_id=consultant_id
        )
        return Page.create(
            items=[JobRead.model_validate(j) for j in items],
            total=total,
            params=params,
        )

    async def get(self, job_id: int, user: User) -> Job:
        job = await self.repo.get_by_id(job_id)
        if job is None:
            raise NotFoundError("Job not found")
        # A consultant may only see jobs assigned to them.
        if not self._can_manage(user) and job.assigned_consultant_id != user.id:
            raise NotFoundError("Job not found")
        return job

    async def create(self, data: JobCreate, created_by_id: int) -> Job:
        job = Job(**data.model_dump(), created_by_id=created_by_id)
        return await self.repo.create(job)

    async def update(self, job_id: int, data: JobUpdate, user: User) -> Job:
        job = await self.get(job_id, user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(job, field, value)
        return job

    async def delete(self, job_id: int, user: User) -> None:
        job = await self.get(job_id, user)
        await self.repo.delete(job)
