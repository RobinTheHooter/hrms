from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import CandidateStage, OfferStatus
from app.common.exceptions import NotFoundError
from app.modules.auth.models import User
from app.modules.candidates.service import CandidateService
from app.modules.offers.models import Offer
from app.modules.offers.schemas import OfferCreate, OfferUpdate


class OfferService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _assert_candidate_visible(self, candidate_id: int, user: User):
        # Reuses candidate scoping/visibility (consultants see only their own).
        return await CandidateService(self.db).get(candidate_id, user)

    async def list_for_candidate(self, candidate_id: int, user: User) -> list[Offer]:
        await self._assert_candidate_visible(candidate_id, user)
        result = await self.db.execute(
            select(Offer)
            .where(Offer.candidate_id == candidate_id)
            .order_by(Offer.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, offer_id: int, user: User) -> Offer:
        offer = await self.db.get(Offer, offer_id)
        if offer is None:
            raise NotFoundError("Offer not found")
        await self._assert_candidate_visible(offer.candidate_id, user)
        return offer

    async def create(self, data: OfferCreate, user: User) -> Offer:
        await self._assert_candidate_visible(data.candidate_id, user)
        offer = Offer(**data.model_dump(), created_by_id=user.id)
        self.db.add(offer)
        await self.db.flush()
        await self.db.refresh(offer)
        return offer

    async def update(self, offer_id: int, data: OfferUpdate, user: User) -> Offer:
        offer = await self.get(offer_id, user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(offer, field, value)
        return offer

    async def set_status(
        self, offer_id: int, status: OfferStatus, user: User
    ) -> Offer:
        offer = await self.get(offer_id, user)
        offer.status = status

        # Reflect terminal offer states onto the candidate's pipeline stage.
        candidate = offer.candidate
        if status == OfferStatus.ACCEPTED:
            candidate.stage = CandidateStage.HIRED
        elif status == OfferStatus.DECLINED:
            candidate.stage = CandidateStage.REJECTED
        return offer
