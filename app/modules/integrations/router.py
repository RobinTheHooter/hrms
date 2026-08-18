from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser
from app.modules.integrations.service import GoogleIntegrationService

settings = get_settings()

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/google/connect")
async def google_connect(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Return the Google consent URL for the current user to visit."""
    url = GoogleIntegrationService(db).connect_url(current_user)
    return {"url": url}


@router.get("/google/callback")
async def google_callback(
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str = Query(...),
    state: str = Query(...),
) -> RedirectResponse:
    """Google redirects the browser here; identity comes from the signed state."""
    await GoogleIntegrationService(db).handle_callback(code, state)
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/integrations?google=connected",
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/google/status")
async def google_status(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await GoogleIntegrationService(db).status(current_user)


@router.delete("/google", status_code=status.HTTP_204_NO_CONTENT)
async def google_disconnect(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await GoogleIntegrationService(db).disconnect(current_user)
