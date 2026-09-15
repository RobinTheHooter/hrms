from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import OnboardingStatus
from app.common.pagination import PageParams
from app.modules.onboarding.models import Onboarding


class OnboardingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, onboarding_id: int) -> Onboarding | None:
        return await self.db.get(Onboarding, onboarding_id)

    async def get_by_candidate(self, candidate_id: int) -> Onboarding | None:
        result = await self.db.execute(
            select(Onboarding).where(Onboarding.candidate_id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def paginate(
        self,
        params: PageParams,
        search: str | None = None,
        status: OnboardingStatus | None = None,
    ) -> tuple[list[Onboarding], int]:
        stmt = select(Onboarding)
        count_stmt = select(func.count()).select_from(Onboarding)

        if search:
            pattern = f"%{search}%"
            condition = or_(
                Onboarding.full_name.ilike(pattern),
                Onboarding.email.ilike(pattern),
                Onboarding.job_title.ilike(pattern),
                Onboarding.department.ilike(pattern),
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        if status is not None:
            stmt = stmt.where(Onboarding.status == status)
            count_stmt = count_stmt.where(Onboarding.status == status)

        stmt = (
            stmt.order_by(Onboarding.start_date.is_(None), Onboarding.start_date)
            .offset(params.offset)
            .limit(params.size)
        )

        items = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return list(items), total

    async def add(self, onboarding: Onboarding) -> Onboarding:
        self.db.add(onboarding)
        await self.db.flush()
        await self.db.refresh(onboarding)
        return onboarding
