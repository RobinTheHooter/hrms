from collections.abc import Callable, Coroutine
from typing import Annotated, Any

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission, role_has_permission
from app.common.enums import UserRole
from app.common.exceptions import AuthError, PermissionError
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise AuthError() from exc

    user = await UserRepository(db).get_by_id(user_id)
    if user is None or not user.is_active:
        raise AuthError()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(
    *roles: UserRole,
) -> Callable[[User], Coroutine[Any, Any, User]]:
    """Dependency factory guarding an endpoint by role."""

    async def _guard(user: CurrentUser) -> User:
        if user.role not in roles:
            raise PermissionError()
        return user

    return _guard


def require_permission(
    *permissions: Permission,
) -> Callable[[User], Coroutine[Any, Any, User]]:
    """Dependency factory guarding an endpoint by permission (ACL)."""

    async def _guard(user: CurrentUser) -> User:
        if not all(role_has_permission(user.role, p) for p in permissions):
            raise PermissionError()
        return user

    return _guard
