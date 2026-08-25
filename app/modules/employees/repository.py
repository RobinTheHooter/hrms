from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PageParams
from app.modules.employees.models import Employee


class EmployeeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, employee_id: int) -> Employee | None:
        return await self.db.get(Employee, employee_id)

    async def get_by_email(self, email: str) -> Employee | None:
        result = await self.db.execute(
            select(Employee).where(Employee.email == email)
        )
        return result.scalar_one_or_none()

    async def paginate(
        self, params: PageParams, search: str | None = None
    ) -> tuple[list[Employee], int]:
        stmt = select(Employee)
        count_stmt = select(func.count()).select_from(Employee)

        if search:
            pattern = f"%{search}%"
            condition = (
                Employee.first_name.ilike(pattern)
                | Employee.last_name.ilike(pattern)
                | Employee.email.ilike(pattern)
                | Employee.job_title.ilike(pattern)
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        stmt = (
            stmt.order_by(Employee.id.desc())
            .offset(params.offset)
            .limit(params.size)
        )

        items = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return list(items), total

    async def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        await self.db.flush()
        await self.db.refresh(employee)
        return employee

    async def delete(self, employee: Employee) -> None:
        await self.db.delete(employee)
        await self.db.flush()
