"""Thin async wrapper over Google's OAuth + userinfo endpoints (httpx)."""
from urllib.parse import urlencode

import httpx

from app.core.config import get_settings

settings = get_settings()

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.freebusy",
]


def build_auth_url(state: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",  # get a refresh token
        "prompt": "consent",  # force refresh token every time
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(TOKEN_URL, data=data)
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(refresh_token: str) -> dict:
    data = {
        "refresh_token": refresh_token,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(TOKEN_URL, data=data)
        resp.raise_for_status()
        return resp.json()


async def fetch_userinfo(access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
        resp.raise_for_status()
        return resp.json()


# ------------------------------ Calendar events ------------------------------

CALENDAR_EVENTS_URL = (
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
)
FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy"


async def free_busy(access_token: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            FREEBUSY_URL, json=body, headers=_auth(access_token)
        )
        resp.raise_for_status()
        return resp.json()


def _auth(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


async def create_event(access_token: str, body: dict, *, conference: bool = False) -> dict:
    params = {"sendUpdates": "all"}
    if conference:
        params["conferenceDataVersion"] = 1
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            CALENDAR_EVENTS_URL, params=params, json=body, headers=_auth(access_token)
        )
        resp.raise_for_status()
        return resp.json()


async def patch_event(access_token: str, event_id: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.patch(
            f"{CALENDAR_EVENTS_URL}/{event_id}",
            params={"sendUpdates": "all"},
            json=body,
            headers=_auth(access_token),
        )
        resp.raise_for_status()
        return resp.json()


async def delete_event(access_token: str, event_id: str) -> None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.delete(
            f"{CALENDAR_EVENTS_URL}/{event_id}",
            params={"sendUpdates": "all"},
            headers=_auth(access_token),
        )
        # 404/410 = already gone; treat as success.
        if resp.status_code not in (200, 204, 404, 410):
            resp.raise_for_status()
