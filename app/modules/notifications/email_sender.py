from email.message import EmailMessage

import aiosmtplib
import httpx

from app.core.config import get_settings

settings = get_settings()


async def send_email(to: str, subject: str, body: str) -> None:
    """Send a plain-text email. Uses the Resend HTTP API when configured
    (works on hosts that block SMTP ports), otherwise falls back to SMTP."""
    if settings.RESEND_API_KEY:
        await _send_resend(to, subject, body)
    else:
        await _send_smtp(to, subject, body)


async def _send_resend(to: str, subject: str, body: str) -> None:
    payload = {
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
        "to": [to],
        "subject": subject,
        "text": body,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"Resend {resp.status_code}: {resp.text}")


async def _send_smtp(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=settings.SMTP_STARTTLS,
    )
