from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import Token, UserRead
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

# User creation now lives in the users module (POST /users, admin-only).


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    # OAuth2 form uses `username`; we treat it as the email.
    return await AuthService(db).authenticate(form_data.username, form_data.password)


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
