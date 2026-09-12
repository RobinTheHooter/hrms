"""Automated onboarding emails — templates, idempotent sending, and audit.

All sends go through `_send`, which is a no-op when email isn't configured and
which refuses to send a (onboarding, kind, ref) combination twice by consulting
the onboarding_notifications log. Safe to call from background tasks and from a
reminder sweep that may run more than once.
"""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.notifications.email_sender import send_email
from app.modules.onboarding.constants import CATEGORY_LABELS, OWNER_LABELS
from app.modules.onboarding.models import Onboarding, OnboardingNotification

settings = get_settings()
logger = logging.getLogger("hrms.onboarding")

# Notification kinds (also the dedupe namespace).
KIND_WELCOME = "welcome"
KIND_INTERNAL_ALERT = "internal_alert"
KIND_DOC_REMINDER = "doc_reminder"
KIND_OVERDUE_DIGEST = "overdue_digest"


def _first_name(full_name: str | None) -> str:
    return (full_name or "there").strip().split(" ")[0] if full_name else "there"


def _fmt_date(d) -> str:
    return d.strftime("%d %b %Y") if d else "TBC"


async def _already_sent(
    db: AsyncSession, onboarding_id: int, kind: str, ref: str | None
) -> bool:
    stmt = select(OnboardingNotification.id).where(
        OnboardingNotification.onboarding_id == onboarding_id,
        OnboardingNotification.kind == kind,
    )
    if ref is not None:
        stmt = stmt.where(OnboardingNotification.ref == ref)
    stmt = stmt.limit(1)
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def _digest_sent_today(db: AsyncSession, ref: str) -> bool:
    stmt = (
        select(OnboardingNotification.id)
        .where(
            OnboardingNotification.kind == KIND_OVERDUE_DIGEST,
            OnboardingNotification.ref == ref,
        )
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def _send(
    db: AsyncSession,
    onboarding: Onboarding,
    *,
    kind: str,
    to_email: str,
    subject: str,
    body: str,
    ref: str | None = None,
) -> bool:
    """Send one onboarding email (idempotent + logged). Returns True if sent."""
    if not settings.email_enabled or not to_email:
        return False
    if await _already_sent(db, onboarding.id, kind, ref):
        return False
    try:
        await send_email(to_email, subject, body)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Onboarding %s email to %s failed: %s", kind, to_email, exc)
        return False
    db.add(
        OnboardingNotification(
            onboarding_id=onboarding.id,
            kind=kind,
            to_email=to_email,
            subject=subject,
            ref=ref,
        )
    )
    return True


def _checklist_lines(onboarding: Onboarding) -> str:
    """Group tasks by category as a plain-text checklist."""
    from collections import defaultdict

    by_cat: dict[str, list] = defaultdict(list)
    for t in sorted(onboarding.tasks, key=lambda x: x.position):
        by_cat[t.category.value].append(t)
    out: list[str] = []
    for cat_value, label in CATEGORY_LABELS.items():
        items = by_cat.get(cat_value)
        if not items:
            continue
        out.append(f"\n{label}:")
        for t in items:
            mark = "[x]" if t.status.value == "done" else "[ ]"
            owner = OWNER_LABELS.get(t.owner.value, "") if t.owner else ""
            due = f" (due {_fmt_date(t.due_date)})" if t.due_date else ""
            suffix = f" — {owner}{due}" if owner or due else due
            out.append(f"  {mark} {t.title}{suffix}")
    return "\n".join(out)


# ------------------------------------------------------------------ event emails
async def send_welcome(db: AsyncSession, onboarding: Onboarding) -> bool:
    if not settings.ONBOARDING_WELCOME_EMAIL:
        return False
    name = _first_name(onboarding.full_name)
    role = onboarding.job_title or "your new role"
    subject = f"Welcome to {settings.EMAIL_FROM_NAME} — let's get you set up"
    body = (
        f"Hi {name},\n\n"
        f"We're excited to have you join us as {role}"
        f"{f' on {_fmt_date(onboarding.start_date)}' if onboarding.start_date else ''}.\n\n"
        f"Here's your onboarding checklist so you know what to expect. A few "
        f"items need you to send documents ahead of your start date:\n"
        f"{_checklist_lines(onboarding)}\n\n"
        f"Our People team will be in touch about each step. If you have any "
        f"questions before then, just reply to this email.\n\n"
        f"Welcome aboard,\n{settings.EMAIL_FROM_NAME}"
    )
    return await _send(
        db, onboarding, kind=KIND_WELCOME, to_email=onboarding.email,
        subject=subject, body=body,
    )


async def send_internal_alert(db: AsyncSession, onboarding: Onboarding) -> bool:
    to = settings.onboarding_alerts_to
    subject = f"New hire onboarding started — {onboarding.full_name}"
    body = (
        f"A new hire has entered onboarding:\n\n"
        f"  Name:       {onboarding.full_name}\n"
        f"  Role:       {onboarding.job_title or '—'}\n"
        f"  Department: {onboarding.department or '—'}\n"
        f"  Start date: {_fmt_date(onboarding.start_date)}\n"
        f"  Manager:    {onboarding.manager_name or '—'}\n"
        f"  Buddy:      {onboarding.buddy_name or '—'}\n\n"
        f"Checklist to prepare:\n{_checklist_lines(onboarding)}\n\n"
        f"Open the Onboarding module to assign owners and track progress."
    )
    return await _send(
        db, onboarding, kind=KIND_INTERNAL_ALERT, to_email=to,
        subject=subject, body=body,
    )


async def send_doc_reminder(
    db: AsyncSession, onboarding: Onboarding, pending: list
) -> bool:
    name = _first_name(onboarding.full_name)
    lines = "\n".join(
        f"  • {t.title}"
        f"{f' (due {_fmt_date(t.due_date)})' if t.due_date else ''}"
        for t in pending
    )
    subject = f"Before your first day — a few items to complete"
    body = (
        f"Hi {name},\n\n"
        f"Your start date is coming up on {_fmt_date(onboarding.start_date)}. "
        f"To make day one smooth, please complete these before then:\n\n"
        f"{lines}\n\n"
        f"Reply to this email if you need any help.\n\n"
        f"See you soon,\n{settings.EMAIL_FROM_NAME}"
    )
    # One nudge per onboarding, keyed to the start date.
    ref = onboarding.start_date.isoformat() if onboarding.start_date else "no-date"
    return await _send(
        db, onboarding, kind=KIND_DOC_REMINDER, to_email=onboarding.email,
        subject=subject, body=body, ref=ref,
    )


async def send_overdue_digest(
    db: AsyncSession, rows: list[tuple[Onboarding, list]], ref: str
) -> bool:
    """One digest email to the internal recipient listing overdue tasks.

    `rows` is a list of (onboarding, [overdue_tasks]). Records a log row per
    onboarding so the digest is deduped for `ref` (the run date).
    """
    to = settings.onboarding_alerts_to
    if not settings.email_enabled or not to or not rows:
        return False
    if await _digest_sent_today(db, ref):
        return False

    blocks: list[str] = []
    total = 0
    for onboarding, tasks in rows:
        total += len(tasks)
        task_lines = "\n".join(
            f"    • {t.title} (was due {_fmt_date(t.due_date)}"
            f"{f', {OWNER_LABELS.get(t.owner.value)}' if t.owner else ''})"
            for t in tasks
        )
        blocks.append(
            f"  {onboarding.full_name} — {onboarding.job_title or '—'} "
            f"(starts {_fmt_date(onboarding.start_date)}):\n{task_lines}"
        )
    subject = f"Onboarding: {total} overdue task(s) need attention"
    body = (
        "The following onboarding tasks are past their due date:\n\n"
        + "\n\n".join(blocks)
        + "\n\nOpen the Onboarding module to follow up."
    )
    try:
        await send_email(to, subject, body)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Onboarding overdue digest to %s failed: %s", to, exc)
        return False
    for onboarding, _ in rows:
        db.add(
            OnboardingNotification(
                onboarding_id=onboarding.id,
                kind=KIND_OVERDUE_DIGEST,
                to_email=to,
                subject=subject,
                ref=ref,
            )
        )
    return True
