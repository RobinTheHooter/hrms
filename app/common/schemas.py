from pydantic import BaseModel, Field


class BulkIds(BaseModel):
    """Payload for bulk operations over a set of row ids."""

    ids: list[int] = Field(min_length=1, max_length=500)


class BulkResult(BaseModel):
    deleted: int
