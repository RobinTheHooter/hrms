from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import AppError, AuthError
from app.core.config import get_settings
from app.modules.auth.models import User
from app.modules.integrations import google_client
from app.modules.integrations.models import GoogleCredential

settings = get_settings()

_STATE_TTL = timedelta(minutes=10)


class GoogleIntegrationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _require_enabled(self) -> None:
        if not settings.google_enabled:
            raise AppError("Google Calendar is not configured on the server")

    def connect_url(self, user: User) -> str:
        self._require_enabled()
        state = jwt.encode(
            {
                "sub": str(user.id),
                "exp": datetime.now(timezone.utc) + _STATE_TTL,
                "typ": "google_oauth",
            },
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM,
        )
        return google_client.build_auth_url(state)

    async def handle_callback(self, code: str, state: str) -> None:
        self._require_enabled()
        try:
            payload = jwt.decode(
                state, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            if payload.get("typ") != "google_oauth":
                raise AuthError("Invalid OAuth state")
            user_id = int(payload["sub"])
        except (jwt.PyJWTError, KeyError, ValueError) as exc:
            raise AuthError("Invalid or expired OAuth state") from exc

        tokens = await google_client.exchange_code(code)
        info = await google_client.fetch_userinfo(tokens["access_token"])

        cred = await self._get(user_id)
        if cred is None:
            cred = GoogleCredential(user_id=user_id)
            self.db.add(cred)

        cred.google_email = info.get("email")
        cred.access_token = tokens.get("access_token")
        # Column is TIMESTAMP WITHOUT TIME ZONE, so store a naive UTC value.
        cred.token_expiry = (
            datetime.now(timezone.utc)
            + timedelta(seconds=int(tokens.get("expires_in", 3600)))
        ).replace(tzinfo=None)
        cred.scope = tokens.get("scope")
        # Google only returns refresh_token on first consent; keep existing otherwise.
        if tokens.get("refresh_token"):
            cred.refresh_token = tokens["refresh_token"]

    async def status(self, user: User) -> dict:
        cred = await self._get(user.id)
        return {
            "enabled": settings.google_enabled,
            "connected": cred is not None and cred.refresh_token is not None,
            "email": cred.google_email if cred else None,
        }

    async def disconnect(self, user: User) -> None:
        cred = await self._get(user.id)
        if cred is not None:
            await self.db.delete(cred)

    async def _get(self, user_id: int) -> GoogleCredential | None:
        result = await self.db.execute(
            select(GoogleCredential).where(GoogleCredential.user_id == user_id)
        )
        return result.scalar_one_or_none()
