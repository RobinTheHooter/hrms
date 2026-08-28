from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.common.enums import (
    CandidateSource,
    CandidateStage,
    InterviewStatus,
    JobStatus,
    UserRole,
)
from app.core.config import get_settings
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.notifications.models import EmailLog

settings = get_settings()

_MANAGE_ALL = (UserRole.ADMIN, UserRole.HR)


def _apply(stmt, cond):
    return stmt.where(cond) if cond is not None else stmt


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- role scoping conditions -------------------------------------------
    def _candidate_cond(self, user: User):
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

    def _job_cond(self, user: User):
        if user.role in _MANAGE_ALL:
            return None
        if user.role == UserRole.CONSULTANT:
            return Job.assigned_consultant_id == user.id
        return Job.id == -1

    def _interview_cond(self, user: User):
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

    async def _scalar(self, stmt) -> int:
        return (await self.db.execute(stmt)).scalar_one()

    async def consultant_breakdown(self) -> list[dict]:
        """Per consultant: assigned jobs (with candidate counts) + profiles submitted."""
        consultants = (
            await self.db.execute(
                select(User.id, User.full_name)
                .where(User.role == UserRole.CONSULTANT)
                .order_by(User.full_name)
            )
        ).all()

        # Jobs per consultant, each with its candidate count.
        job_rows = (
            await self.db.execute(
                select(
                    Job.assigned_consultant_id,
                    Job.id,
                    Job.title,
                    func.count(Candidate.id),
                )
                .outerjoin(Candidate, Candidate.job_id == Job.id)
                .where(Job.assigned_consultant_id.is_not(None))
                .group_by(Job.assigned_consultant_id, Job.id, Job.title)
                .order_by(Job.title)
            )
        ).all()

        jobs_by_consultant: dict[int, list[dict]] = {}
        for consultant_id, job_id, title, count in job_rows:
            jobs_by_consultant.setdefault(consultant_id, []).append(
                {"job_id": job_id, "title": title, "candidate_count": int(count)}
            )

        # Profiles each consultant personally submitted (created).
        submitted_rows = (
            await self.db.execute(
                select(Candidate.created_by_id, func.count())
                .where(Candidate.created_by_id.is_not(None))
                .group_by(Candidate.created_by_id)
            )
        ).all()
        submitted = {cid: int(n) for cid, n in submitted_rows}

        result = []
        for cid, name in consultants:
            jobs = jobs_by_consultant.get(cid, [])
            result.append(
                {
                    "consultant_id": cid,
                    "name": name,
                    "jobs": jobs,
                    "total_jobs": len(jobs),
                    "total_candidates": sum(j["candidate_count"] for j in jobs),
                    "submitted": submitted.get(cid, 0),
                }
            )
        return result

    async def recent_decisions(self, user: User, limit: int = 12) -> list[dict]:
        """Latest hiring-manager decisions (completed interviews with feedback),
        scoped to what the current user is allowed to see."""
        cond = self._interview_cond(user)
        manager = aliased(User)
        stmt = (
            select(
                Interview.id,
                Interview.candidate_id,
                Candidate.full_name,
                Job.title,
                Interview.outcome,
                Interview.scheduled_at,
                Interview.updated_at,
                Interview.feedback,
                manager.full_name,
            )
            .join(Candidate, Interview.candidate_id == Candidate.id)
            .join(Job, Candidate.job_id == Job.id)
            .join(manager, Interview.hiring_manager_id == manager.id, isouter=True)
            .where(Interview.status == InterviewStatus.COMPLETED)
            .order_by(Interview.updated_at.desc())
            .limit(limit)
        )
        stmt = _apply(stmt, cond)
        rows = (await self.db.execute(stmt)).all()
        return [
            {
                "interview_id": r[0],
                "candidate_id": r[1],
                "candidate_name": r[2],
                "job_title": r[3],
                "outcome": r[4].value,
                "scheduled_at": r[5].isoformat() if r[5] else None,
                "decided_at": r[6].isoformat() if r[6] else None,
                "feedback": r[7],
                "hiring_manager": r[8],
            }
            for r in rows
        ]

    # --- summary -----------------------------------------------------------
    async def summary(self, user: User, days: int = 7) -> dict:
        cand_cond = self._candidate_cond(user)
        job_cond = self._job_cond(user)
        intv_cond = self._interview_cond(user)

        tz = ZoneInfo(settings.APP_TIMEZONE)
        now_local = datetime.now(tz).replace(tzinfo=None)
        today = datetime.now(tz).date()
        day_start = datetime.combine(today, time.min)
        day_end = datetime.combine(today, time.max)

        # Jobs
        total_jobs = await self._scalar(
            _apply(select(func.count()).select_from(Job), job_cond)
        )
        open_jobs = await self._scalar(
            _apply(
                select(func.count()).select_from(Job).where(Job.status == JobStatus.OPEN),
                job_cond,
            )
        )

        # Candidates by stage
        stage_rows = await self.db.execute(
            _apply(
                select(Candidate.stage, func.count()).group_by(Candidate.stage),
                cand_cond,
            )
        )
        stage_counts = {row[0]: row[1] for row in stage_rows.all()}
        by_stage = [
            {"stage": s.value, "count": int(stage_counts.get(s, 0))}
            for s in CandidateStage
        ]
        total_candidates = sum(stage_counts.values())
        hired = int(stage_counts.get(CandidateStage.HIRED, 0))
        rejected = int(stage_counts.get(CandidateStage.REJECTED, 0))
        active_candidates = int(total_candidates - hired - rejected)

        # Candidates by source
        source_rows = await self.db.execute(
            _apply(
                select(Candidate.source, func.count()).group_by(Candidate.source),
                cand_cond,
            )
        )
        src_counts = {row[0]: row[1] for row in source_rows.all()}
        by_source = [
            {"source": s.value, "count": int(src_counts.get(s, 0))}
            for s in CandidateSource
        ]

        # Interviews
        upcoming = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(
                    Interview.status == InterviewStatus.SCHEDULED,
                    Interview.scheduled_at >= now_local,
                ),
                intv_cond,
            )
        )
        today_count = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(Interview.scheduled_at.between(day_start, day_end)),
                intv_cond,
            )
        )
        awaiting_outcome = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(Interview.status == InterviewStatus.SCHEDULED),
                intv_cond,
            )
        )
        completed = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(Interview.status == InterviewStatus.COMPLETED),
                intv_cond,
            )
        )

        upcoming_stmt = _apply(
            select(Interview)
            .where(
                Interview.status == InterviewStatus.SCHEDULED,
                Interview.scheduled_at >= now_local,
            )
            .order_by(Interview.scheduled_at.asc())
            .limit(5),
            intv_cond,
        )
        upcoming_list = [
            {
                "id": iv.id,
                "candidate_name": iv.candidate.full_name if iv.candidate else None,
                "job_title": iv.candidate.job.title
                if iv.candidate and iv.candidate.job
                else None,
                "hiring_manager": iv.hiring_manager.full_name
                if iv.hiring_manager
                else None,
                "scheduled_at": iv.scheduled_at.isoformat(),
                "mode": iv.mode.value,
                "meeting_link": iv.meeting_link,
            }
            for iv in (await self.db.execute(upcoming_stmt)).scalars().all()
        ]

        # Recent candidates
        recent_stmt = _apply(
            select(Candidate).order_by(Candidate.id.desc()).limit(5), cand_cond
        )
        recent_candidates = [
            {
                "id": c.id,
                "full_name": c.full_name,
                "job_title": c.job.title if c.job else None,
                "stage": c.stage.value,
                "created_at": c.created_at.isoformat(),
            }
            for c in (await self.db.execute(recent_stmt)).scalars().all()
        ]

        # ---- Activity window (scoped) ----
        week_ago = datetime.utcnow() - timedelta(days=days)

        candidates_added_7d = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Candidate)
                .where(Candidate.created_at >= week_ago),
                cand_cond,
            )
        )
        interviews_scheduled_7d = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(Interview.created_at >= week_ago),
                intv_cond,
            )
        )
        interviews_completed_7d = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Interview)
                .where(
                    Interview.status == InterviewStatus.COMPLETED,
                    Interview.updated_at >= week_ago,
                ),
                intv_cond,
            )
        )
        hires_7d = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Candidate)
                .where(
                    Candidate.stage == CandidateStage.HIRED,
                    Candidate.updated_at >= week_ago,
                ),
                cand_cond,
            )
        )
        emails_stmt = (
            select(func.count())
            .select_from(EmailLog)
            .where(EmailLog.created_at >= week_ago)
        )
        if cand_cond is not None:
            emails_stmt = emails_stmt.where(
                EmailLog.candidate_id.in_(select(Candidate.id).where(cand_cond))
            )
        emails_sent_7d = await self._scalar(emails_stmt)

        # ---- Pending / needs attention (scoped) ----
        to_review = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Candidate)
                .where(
                    Candidate.stage.in_(
                        [CandidateStage.APPLIED, CandidateStage.SCREENING]
                    )
                ),
                cand_cond,
            )
        )
        offers_out = await self._scalar(
            _apply(
                select(func.count())
                .select_from(Candidate)
                .where(Candidate.stage == CandidateStage.OFFER),
                cand_cond,
            )
        )

        # ---- New-candidates trend (scoped, gap-filled) ----
        trend_rows = await self.db.execute(
            _apply(
                select(func.date(Candidate.created_at), func.count())
                .where(Candidate.created_at >= week_ago)
                .group_by(func.date(Candidate.created_at)),
                cand_cond,
            )
        )
        trend_counts = {row[0]: int(row[1]) for row in trend_rows.all()}
        today_d = datetime.utcnow().date()
        start_d = today_d - timedelta(days=days - 1)
        candidates_trend = [
            {
                "date": (start_d + timedelta(days=n)).isoformat(),
                "count": trend_counts.get(start_d + timedelta(days=n), 0),
            }
            for n in range(days)
        ]

        result = {
            "role": user.role.value,
            "activity": {
                "days": days,
                "candidates_added": int(candidates_added_7d),
                "interviews_scheduled": int(interviews_scheduled_7d),
                "interviews_completed": int(interviews_completed_7d),
                "hires": int(hires_7d),
                "emails_sent": int(emails_sent_7d),
            },
            "candidates_trend": candidates_trend,
            "pending": {
                "to_review": int(to_review),
                "offers_out": int(offers_out),
                "interviews_upcoming": int(upcoming),
                "awaiting_outcome": int(awaiting_outcome),
            },
            "jobs": {
                "total": int(total_jobs),
                "open": int(open_jobs),
                "closed": int(total_jobs - open_jobs),
            },
            "candidates": {
                "total": int(total_candidates),
                "active": active_candidates,
                "hired": hired,
                "by_stage": by_stage,
                "by_source": by_source,
            },
            "interviews": {
                "upcoming": int(upcoming),
                "today": int(today_count),
                "awaiting_outcome": int(awaiting_outcome),
                "completed": int(completed),
                "upcoming_list": upcoming_list,
            },
            "recent_candidates": recent_candidates,
        }

        # Admin/HR extras
        if user.role in _MANAGE_ALL:
            dept_rows = await self.db.execute(
                select(Job.department, func.count())
                .where(Job.department.is_not(None))
                .group_by(Job.department)
            )
            result["jobs_by_department"] = [
                {"department": row[0], "count": int(row[1])} for row in dept_rows.all()
            ]

            workload_rows = await self.db.execute(
                select(User.full_name, func.count(Candidate.id))
                .join(Job, Job.assigned_consultant_id == User.id)
                .join(Candidate, Candidate.job_id == Job.id)
                .where(User.role == UserRole.CONSULTANT)
                .group_by(User.full_name)
            )
            result["consultant_workload"] = [
                {"name": row[0], "count": int(row[1])} for row in workload_rows.all()
            ]

        if user.role == UserRole.ADMIN:
            role_rows = await self.db.execute(
                select(User.role, func.count()).group_by(User.role)
            )
            result["users_by_role"] = [
                {"role": row[0].value, "count": int(row[1])} for row in role_rows.all()
            ]

        return result
