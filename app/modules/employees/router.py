from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.common.pagination import Page, PageParams
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.employees.schemas import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
)
from app.modules.employees.service import EmployeeService

# ACL: reads need employees:view, writes need employees:manage.
read_access = Depends(require_permission(Permission.EMPLOYEES_VIEW))
write_access = Depends(require_permission(Permission.EMPLOYEES_MANAGE))

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=Page[EmployeeRead], dependencies=[read_access])
async def list_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
) -> Page[EmployeeRead]:
    params = PageParams(page=page, size=size)
    return await EmployeeService(db).list(params, search)


@router.post(
    "",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[write_access],
)
async def create_employee(
    data: EmployeeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).create(data)
    return EmployeeRead.model_validate(employee)


@router.get(
    "/{employee_id}", response_model=EmployeeRead, dependencies=[read_access]
)
async def get_employee(
    employee_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).get(employee_id)
    return EmployeeRead.model_validate(employee)


@router.patch(
    "/{employee_id}", response_model=EmployeeRead, dependencies=[write_access]
)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmployeeRead:
    employee = await EmployeeService(db).update(employee_id, data)
    return EmployeeRead.model_validate(employee)


@router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[write_access],
)
async def delete_employee(
    employee_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await EmployeeService(db).delete(employee_id)
