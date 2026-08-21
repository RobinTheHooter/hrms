"""Activity feed for the header notifications bell.

There's no dedicated notifications table yet — this derives a role-scoped feed
from recent candidates and interviews. Read-state (unread badge) is tracked
client-side via a "last seen" timestamp.
"""
from datetime import datetime
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.acl import Permission
from app.common.enums import InterviewStatus, UserRole
from app.common.pagination import Page
from app.common.query import ListParamsDep
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.notifications.models import EmailLog

router = APIRouter(prefix="/notifications", tags=["notifications"])

_MANAGE_ALL = (UserRole.ADMIN, UserRole.HR)

_INTERVIEW_TITLE = {
    InterviewStatus.SCHEDULED: "Interview scheduled",
    InterviewStatus.COMPLETED: "Interview completed",
    InterviewStatus.CANCELLED: "Interview cancelled",
}


class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    timestamp: datetime
    link: str


def _candidate_cond(user: User):
    if user.role in _MANAGE_ALL:
        return None
    if user.role == UserRole.CONSULTANT:
        return Candidate.job_id.in_(
            select(Job.id).where(Job.assigned_consultant_id == user.id)
        )
    if user.role == UserRole.HIRING_MANAGER:
        return Candidate.id.in_(
            select(Interview.candidate_id).where(
                Interview.hiring_manager_id == user.id
            )
        )
    return Candidate.id == -1


def _interview_cond(user: User):
    if user.role in _MANAGE_ALL:
        return None
    if user.role == UserRole.CONSULTANT:
        sub = (
            select(Candidate.id)
            .join(Job, Candidate.job_id == Job.id)
            .where(Job.assigned_consultant_id == user.id)
        )
        return Interview.candidate_id.in_(sub)
    if user.role == UserRole.HIRING_MANAGER:
        return Interview.hiring_manager_id == user.id
    return Interview.id == -1


@router.get("", response_model=list[NotificationItem])
async def list_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(15, ge=1, le=50),
) -> list[NotificationItem]:
    # Recent candidates
    c_stmt = (
        select(Candidate)
        .options(selectinload(Candidate.job))
        .order_by(Candidate.created_at.desc())
        .limit(limit)
    )
    cond = _candidate_cond(current_user)
    if cond is not None:
        c_stmt = c_stmt.where(cond)
    candidates = (await db.execute(c_stmt)).scalars().all()

    # Recent interviews
    i_stmt = (
        select(Interview)
        .options(selectinload(Interview.candidate))
        .order_by(Interview.created_at.desc())
        .limit(limit)
    )
    cond = _interview_cond(current_user)
    if cond is not None:
        i_stmt = i_stmt.where(cond)
    interviews = (await db.execute(i_stmt)).scalars().all()

    items: list[NotificationItem] = []

    for c in candidates:
        detail = c.job.title if c.job else None
        items.append(
            NotificationItem(
                id=f"candidate-{c.id}",
                type="candidate",
                title="New candidate",
                message=f"{c.full_name}" + (f" · {detail}" if detail else ""),
                timestamp=c.created_at,
                link=f"/candidates?search={quote(c.full_name)}",
            )
        )

    for iv in interviews:
        name = iv.candidate.full_name if iv.candidate else "Candidate"
        items.append(
            NotificationItem(
                id=f"interview-{iv.id}",
                type="interview",
                title=_INTERVIEW_TITLE.get(iv.status, "Interview updated"),
                message=name,
                timestamp=iv.created_at,
                link="/interviews",
            )
        )

    items.sort(key=lambda x: x.timestamp, reverse=True)
    return items[:limit]


# --- Sent mail log --------------------------------------------------------

MailUser = Annotated[User, Depends(require_permission(Permission.CANDIDATES_VIEW))]


class EmailLogRead(BaseModel):
    id: int
    to_email: str
    subject: str
    body: str
    candidate_id: int
    candidate_name: str | None
    sent_by_name: str | None
    created_at: datetime


def _email_scope(user: User):
    """Restrict the mail log to emails for candidates the user can see."""
    if user.role in _MANAGE_ALL:
        return None
    if user.role == UserRole.CONSULTANT:
        return Candidate.job_id.in_(
            select(Job.id).where(Job.assigned_consultant_id == user.id)
        )
    if user.role == UserRole.HIRING_MANAGER:
        return Candidate.id.in_(
            select(Interview.candidate_id).where(
                Interview.hiring_manager_id == user.id
            )
        )
    return EmailLog.id == -1


@router.get("/emails", response_model=Page[EmailLogRead])
async def list_emails(
    current_user: MailUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    params: ListParamsDep,
) -> Page[EmailLogRead]:
    conds = []
    scope = _email_scope(current_user)
    if scope is not None:
        conds.append(scope)
    if params.search:
        term = f"%{params.search}%"
        conds.append(
            or_(
                EmailLog.subject.ilike(term),
                EmailLog.to_email.ilike(term),
                Candidate.full_name.ilike(term),
            )
        )
    where = and_(*conds) if conds else None

    count_stmt = select(func.count(EmailLog.id)).join(
        Candidate, EmailLog.candidate_id == Candidate.id
    )
    if where is not None:
        count_stmt = count_stmt.where(where)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(EmailLog, Candidate.full_name, User.full_name)
        .join(Candidate, EmailLog.candidate_id == Candidate.id)
        .outerjoin(User, EmailLog.sent_by_id == User.id)
    )
    if where is not None:
        stmt = stmt.where(where)
    page = params.page_params
    stmt = stmt.order_by(EmailLog.created_at.desc()).offset(page.offset).limit(page.size)

    rows = (await db.execute(stmt)).all()
    items = [
        EmailLogRead(
            id=log.id,
            to_email=log.to_email,
            subject=log.subject,
            body=log.body,
            candidate_id=log.candidate_id,
            candidate_name=cand_name,
            sent_by_name=sender_name,
            created_at=log.created_at,
        )
        for (log, cand_name, sender_name) in rows
    ]
    return Page.create(items=items, total=total, params=page)
