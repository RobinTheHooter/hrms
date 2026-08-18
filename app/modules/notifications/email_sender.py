from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings

settings = get_settings()


async def send_email(to: str, subject: str, body: str) -> None:
    """Send a plain-text email via SMTP. Raises on failure."""
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
