from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, require_permission
from app.modules.dashboard.analytics import AnalyticsService
from app.modules.dashboard.report import MISReportService
from app.modules.dashboard.service import DashboardService

_XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

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


@router.get(
    "/analytics/recruiting",
    dependencies=[Depends(require_permission(Permission.JOBS_MANAGE))],
)
async def recruiting_analytics(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await AnalyticsService(db).recruiting()


@router.get(
    "/analytics/attrition",
    dependencies=[Depends(require_permission(Permission.JOBS_MANAGE))],
)
async def attrition_analytics(
    db: Annotated[AsyncSession, Depends(get_db)],
    months: int = Query(12, ge=3, le=36),
) -> dict:
    return await AnalyticsService(db).attrition(months)


@router.get(
    "/mis-report",
    dependencies=[Depends(require_permission(Permission.JOBS_MANAGE))],
)
async def mis_report(db: Annotated[AsyncSession, Depends(get_db)]) -> Response:
    data = await MISReportService(db).build()
    filename = f"mis-report-{date.today().isoformat()}.xlsx"
    return Response(
        content=data,
        media_type=_XLSX_MIME,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
