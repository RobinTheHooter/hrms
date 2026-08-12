from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.common.pagination import Page, PageParams
from app.modules.employees.models import Employee
from app.modules.employees.repository import EmployeeRepository
from app.modules.employees.schemas import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
)


class EmployeeService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = EmployeeRepository(db)

    async def list(
        self, params: PageParams, search: str | None = None
    ) -> Page[EmployeeRead]:
        items, total = await self.repo.list(params, search)
        return Page.create(
            items=[EmployeeRead.model_validate(e) for e in items],
            total=total,
            params=params,
        )

    async def get(self, employee_id: int) -> Employee:
        employee = await self.repo.get_by_id(employee_id)
        if employee is None:
            raise NotFoundError("Employee not found")
        return employee

    async def create(self, data: EmployeeCreate) -> Employee:
        if await self.repo.get_by_email(data.email) is not None:
            raise ConflictError("An employee with this email already exists")
        employee = Employee(**data.model_dump())
        return await self.repo.create(employee)

    async def update(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = await self.get(employee_id)

        updates = data.model_dump(exclude_unset=True)
        new_email = updates.get("email")
        if new_email and new_email != employee.email:
            if await self.repo.get_by_email(new_email) is not None:
                raise ConflictError("An employee with this email already exists")

        for field, value in updates.items():
            setattr(employee, field, value)
        return employee

    async def delete(self, employee_id: int) -> None:
        employee = await self.get(employee_id)
        await self.repo.delete(employee)
