"""Shared list-endpoint query params.

Every list endpoint accepts the same pagination + free-text search + sort
inputs; this centralises them so routers don't re-declare the boilerplate.
Entity-specific filters (status, stage, role, …) stay as explicit Query params
on each endpoint.
"""
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query

from app.common.pagination import PageParams

# Keep in sync with the frontend table page-size options.
MAX_PAGE_SIZE = 1000

@dataclass(frozen=True)
class ListParams:
    page: int
    size: int
    search: str | None
    sort: str | None

    @property
    def page_params(self) -> PageParams:
        return PageParams(page=self.page, size=self.size)


def list_params(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    search: str | None = Query(None, description="Free-text search"),
    sort: str | None = Query(None, description="Sort key"),
) -> ListParams:
    return ListParams(page=page, size=size, search=search, sort=sort)


ListParamsDep = Annotated[ListParams, Depends(list_params)]
