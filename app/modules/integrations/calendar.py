"""High-level Google Calendar sync used by the interviews module.

Every method degrades gracefully: if the manager hasn't connected Google, a
token can't be refreshed, or the API errors, it returns None / no-ops so the
interview still saves.
"""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.integrations import google_client
from app.modules.integrations.models import GoogleCredential

settings = get_settings()


class GoogleCalendarService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _cred(self, user_id: int) -> GoogleCredential | None:
        result = await self.db.execute(
            select(GoogleCredential).where(GoogleCredential.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _access_token(self, user_id: int) -> str | None:
        cred = await self._cred(user_id)
        if cred is None or not cred.refresh_token:
            return None
        now = datetime.utcnow()
        if cred.token_expiry is None or cred.token_expiry <= now + timedelta(seconds=60):
            try:
                tokens = await google_client.refresh_access_token(cred.refresh_token)
            except Exception:
                return None
            cred.access_token = tokens.get("access_token")
            cred.token_expiry = (
                datetime.now(timezone.utc)
                + timedelta(seconds=int(tokens.get("expires_in", 3600)))
            ).replace(tzinfo=None)
        return cred.access_token

    def _body(self, *, summary, description, start_dt, mode, location, attendee_emails):
        end_dt = start_dt + timedelta(minutes=settings.INTERVIEW_DURATION_MINUTES)
        tz = settings.APP_TIMEZONE
        body = {
            "summary": summary,
            "description": description or "",
            "start": {"dateTime": start_dt.isoformat(timespec="seconds"), "timeZone": tz},
            "end": {"dateTime": end_dt.isoformat(timespec="seconds"), "timeZone": tz},
            "attendees": [{"email": e} for e in attendee_emails if e],
        }
        if str(mode) == "walk_in" and location:
            body["location"] = location
        return body

    async def create_event_for(self, manager_id, **data) -> tuple[str | None, str | None]:
        token = await self._access_token(manager_id)
        if not token:
            return (None, None)
        conference = str(data.get("mode")) == "virtual"
        body = self._body(**data)
        if conference:
            body["conferenceData"] = {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }
        try:
            ev = await google_client.create_event(token, body, conference=conference)
        except Exception:
            return (None, None)
        return (ev.get("id"), ev.get("hangoutLink") or ev.get("htmlLink"))

    async def update_event_for(self, manager_id, event_id, **data) -> tuple[str | None, str | None]:
        token = await self._access_token(manager_id)
        if not token:
            return (event_id, None)
        try:
            ev = await google_client.patch_event(token, event_id, self._body(**data))
        except Exception:
            return (event_id, None)
        return (event_id, ev.get("hangoutLink") or ev.get("htmlLink"))

    async def free_busy(self, manager_id, time_min, time_max, tz) -> list | None:
        """Return the manager's busy blocks, or None if not connected/error."""
        token = await self._access_token(manager_id)
        if not token:
            return None
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "timeZone": tz,
            "items": [{"id": "primary"}],
        }
        try:
            data = await google_client.free_busy(token, body)
        except Exception:
            return None
        cal = (data.get("calendars") or {}).get("primary") or {}
        return cal.get("busy", [])

    async def delete_event_for(self, manager_id, event_id) -> None:
        token = await self._access_token(manager_id)
        if not token:
            return
        try:
            await google_client.delete_event(token, event_id)
        except Exception:
            pass
