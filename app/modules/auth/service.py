from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AuthError, ConflictError
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import Token, UserRegister


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def register(self, data: UserRegister) -> User:
        existing = await self.repo.get_by_email(data.email)
        if existing is not None:
            raise ConflictError("A user with this email already exists")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )
        return await self.repo.create(user)

    async def authenticate(self, email: str, password: str) -> Token:
        user = await self.repo.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthError("Incorrect email or password")
        if not user.is_active:
            raise AuthError("User account is inactive")

        token = create_access_token(subject=user.id)
        return Token(access_token=token)
