from datetime import datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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

    # --- summary -----------------------------------------------------------
    async def summary(self, user: User) -> dict:
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

        result = {
            "role": user.role.value,
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
