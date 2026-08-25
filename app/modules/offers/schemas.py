from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums import OfferStatus


class OfferBase(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    ctc: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    expiry_date: date | None = None
    notes: str | None = None


class OfferCreate(OfferBase):
    candidate_id: int


class OfferUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    ctc: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    expiry_date: date | None = None
    notes: str | None = None


class OfferStatusUpdate(BaseModel):
    status: OfferStatus


class OfferRead(OfferBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    status: OfferStatus
    created_at: datetime
    updated_at: datetime
