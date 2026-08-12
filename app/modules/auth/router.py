from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import UserRole
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, require_roles
from app.modules.auth.schemas import Token, UserRead, UserRegister
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
async def register(
    data: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRead:
    user = await AuthService(db).register(data)
    return UserRead.model_validate(user)


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
