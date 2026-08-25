from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.core.database import get_db
from app.modules.auth.dependencies import require_permission
from app.modules.auth.models import User
from app.modules.offers.schemas import (
    OfferCreate,
    OfferRead,
    OfferStatusUpdate,
    OfferUpdate,
)
from app.modules.offers.service import OfferService

router = APIRouter(prefix="/offers", tags=["offers"])

ViewUser = Annotated[User, Depends(require_permission(Permission.CANDIDATES_VIEW))]
ManageUser = Annotated[User, Depends(require_permission(Permission.CANDIDATES_MANAGE))]


@router.get("", response_model=list[OfferRead])
async def list_offers(
    current_user: ViewUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    candidate_id: int = Query(...),
) -> list[OfferRead]:
    offers = await OfferService(db).list_for_candidate(candidate_id, current_user)
    return [OfferRead.model_validate(o) for o in offers]


@router.post("", response_model=OfferRead, status_code=status.HTTP_201_CREATED)
async def create_offer(
    data: OfferCreate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OfferRead:
    offer = await OfferService(db).create(data, current_user)
    return OfferRead.model_validate(offer)


@router.patch("/{offer_id}", response_model=OfferRead)
async def update_offer(
    offer_id: int,
    data: OfferUpdate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OfferRead:
    offer = await OfferService(db).update(offer_id, data, current_user)
    return OfferRead.model_validate(offer)


@router.post("/{offer_id}/status", response_model=OfferRead)
async def set_offer_status(
    offer_id: int,
    data: OfferStatusUpdate,
    current_user: ManageUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OfferRead:
    offer = await OfferService(db).set_status(offer_id, data.status, current_user)
    return OfferRead.model_validate(offer)
