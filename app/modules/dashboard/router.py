from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, require_permission
from app.modules.dashboard.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(7, ge=1, le=90),
) -> dict:
    return await DashboardService(db).summary(current_user, days)


@router.get(
    "/consultants",
    dependencies=[Depends(require_permission(Permission.JOBS_MANAGE))],
)
async def consultant_breakdown(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    return await DashboardService(db).consultant_breakdown()
