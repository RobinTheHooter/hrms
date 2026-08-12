from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import Page, PageParams
from app.core.database import get_db
from app.modules.employees.schemas import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
)
from app.modules.employees.service import EmployeeService

# To require auth once you're ready, add this to the router or per-route:
#   from app.modules.auth.dependencies import CurrentUser, require_roles
#   dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR))]
router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=Page[EmployeeRead])
async def list_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
) -> Page[EmployeeRead]:
    params = PageParams(page=page, size=size)
    return await EmployeeService(db).list(params, search)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).create(data)
    return EmployeeRead.model_validate(employee)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).get(employee_id)
    return EmployeeRead.model_validate(employee)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).update(employee_id, data)
    return EmployeeRead.model_validate(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await EmployeeService(db).delete(employee_id)
