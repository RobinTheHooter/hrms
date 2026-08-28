"""Deeper analytics for the People Data & Insights module.

Two areas:
  * Recruiting analytics — funnel, time-to-hire, offer acceptance, source
    effectiveness and interview outcomes, over the live ATS data.
  * Employee attrition — headcount, turnover, tenure and leavers over time.

Aggregation is done in Python after simple selects so the queries stay portable
across SQLite (local) and Postgres (deployed) without dialect-specific date SQL.
"""

from collections import defaultdict
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    CandidateSource,
    CandidateStage,
    EmployeeStatus,
    InterviewOutcome,
    InterviewStatus,
    OfferStatus,
)
from app.modules.candidates.models import Candidate
from app.modules.employees.models import Employee
from app.modules.interviews.models import Interview
from app.modules.offers.models import Offer

# Forward pipeline order; REJECTED is terminal and sits outside the funnel.
_FUNNEL_ORDER = [
    CandidateStage.APPLIED,
    CandidateStage.SCREENING,
    CandidateStage.INTERVIEW,
    CandidateStage.OFFER,
    CandidateStage.HIRED,
]


def _month_key(dt: datetime | date) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


def _last_months(n: int) -> list[str]:
    today = date.today()
    keys = []
    y, m = today.year, today.month
    for _ in range(n):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(keys))


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------ #
    # Recruiting analytics
    # ------------------------------------------------------------------ #
    async def recruiting(self) -> dict:
        stage_counts = await self._stage_counts()
        funnel = self._funnel(stage_counts)
        return {
            "funnel": funnel,
            "time_to_hire": await self._time_to_hire(),
            "offer_acceptance": await self._offer_acceptance(),
            "source_effectiveness": await self._source_effectiveness(),
            "interview_outcomes": await self._interview_outcomes(),
        }

    async def _stage_counts(self) -> dict[CandidateStage, int]:
        rows = (
            await self.db.execute(
                select(Candidate.stage, func.count()).group_by(Candidate.stage)
            )
        ).all()
        return {stage: int(n) for stage, n in rows}

    def _funnel(self, stage_counts: dict) -> dict:
        """Approximate funnel: candidates that *reached* each stage.

        Without per-stage history we assume forward progress — anyone currently
        at or beyond a stage must have passed through it. Rejected candidates are
        excluded because their furthest stage is unknown.
        """
        idx = {s: i for i, s in enumerate(_FUNNEL_ORDER)}
        reached = []
        for i, stage in enumerate(_FUNNEL_ORDER):
            count = sum(
                c
                for s, c in stage_counts.items()
                if s in idx and idx[s] >= i
            )
            reached.append({"stage": stage.value, "count": count})
        top = reached[0]["count"] or 1
        for step in reached:
            step["pct_of_top"] = round(step["count"] * 100 / top, 1)
        hired = stage_counts.get(CandidateStage.HIRED, 0)
        total = sum(stage_counts.values())
        return {
            "stages": reached,
            "rejected": int(stage_counts.get(CandidateStage.REJECTED, 0)),
            "overall_conversion": round(hired * 100 / total, 1) if total else 0.0,
        }

    async def _time_to_hire(self) -> dict:
        rows = (
            await self.db.execute(
                select(Candidate.created_at, Candidate.updated_at).where(
                    Candidate.stage == CandidateStage.HIRED
                )
            )
        ).all()
        days = [
            (upd - crt).days
            for crt, upd in rows
            if crt and upd and (upd - crt).days >= 0
        ]
        if not days:
            return {"count": 0, "avg_days": None, "median_days": None}
        days.sort()
        mid = len(days) // 2
        median = (
            days[mid]
            if len(days) % 2
            else round((days[mid - 1] + days[mid]) / 2, 1)
        )
        return {
            "count": len(days),
            "avg_days": round(sum(days) / len(days), 1),
            "median_days": median,
        }

    async def _offer_acceptance(self) -> dict:
        rows = (
            await self.db.execute(
                select(Offer.status, func.count()).group_by(Offer.status)
            )
        ).all()
        counts = {status: int(n) for status, n in rows}
        accepted = counts.get(OfferStatus.ACCEPTED, 0)
        declined = counts.get(OfferStatus.DECLINED, 0)
        responded = accepted + declined
        total = sum(counts.values())
        return {
            "by_status": [
                {"status": s.value, "count": counts.get(s, 0)} for s in OfferStatus
            ],
            "total": total,
            "accepted": accepted,
            "declined": declined,
            "acceptance_rate": round(accepted * 100 / responded, 1) if responded else None,
        }

    async def _source_effectiveness(self) -> list[dict]:
        rows = (
            await self.db.execute(
                select(Candidate.source, Candidate.stage, func.count()).group_by(
                    Candidate.source, Candidate.stage
                )
            )
        ).all()
        total: dict = defaultdict(int)
        hired: dict = defaultdict(int)
        for source, stage, n in rows:
            total[source] += int(n)
            if stage == CandidateStage.HIRED:
                hired[source] += int(n)
        result = []
        for s in CandidateSource:
            t = total.get(s, 0)
            h = hired.get(s, 0)
            result.append(
                {
                    "source": s.value,
                    "total": t,
                    "hired": h,
                    "conversion": round(h * 100 / t, 1) if t else 0.0,
                }
            )
        return result

    async def _interview_outcomes(self) -> dict:
        rows = (
            await self.db.execute(
                select(Interview.outcome, func.count())
                .where(Interview.status == InterviewStatus.COMPLETED)
                .group_by(Interview.outcome)
            )
        ).all()
        counts = {outcome: int(n) for outcome, n in rows}
        return {
            "by_outcome": [
                {"outcome": o.value, "count": counts.get(o, 0)}
                for o in InterviewOutcome
            ],
            "completed": sum(counts.values()),
        }

    # ------------------------------------------------------------------ #
    # Employee attrition
    # ------------------------------------------------------------------ #
    async def attrition(self, months: int = 12) -> dict:
        employees = (
            await self.db.execute(
                select(
                    Employee.status,
                    Employee.department,
                    Employee.date_of_joining,
                    Employee.updated_at,
                )
            )
        ).all()

        active_statuses = {
            EmployeeStatus.ACTIVE,
            EmployeeStatus.PROBATION,
            EmployeeStatus.ON_LEAVE,
        }
        active = [e for e in employees if e.status in active_statuses]
        terminated = [e for e in employees if e.status == EmployeeStatus.TERMINATED]

        headcount = len(active)
        left = len(terminated)
        base = headcount + left
        turnover_rate = round(left * 100 / base, 1) if base else 0.0

        # By department: active vs left.
        dept_active: dict = defaultdict(int)
        dept_left: dict = defaultdict(int)
        for e in active:
            dept_active[e.department or "Unassigned"] += 1
        for e in terminated:
            dept_left[e.department or "Unassigned"] += 1
        departments = sorted(set(dept_active) | set(dept_left))
        by_department = [
            {
                "department": d,
                "active": dept_active.get(d, 0),
                "left": dept_left.get(d, 0),
            }
            for d in departments
        ]

        # Tenure (years).
        today = date.today()

        def _years(start: date, end: date) -> float:
            return round((end - start).days / 365.25, 1)

        active_tenures = [
            _years(e.date_of_joining, today) for e in active if e.date_of_joining
        ]
        exit_tenures = [
            _years(e.date_of_joining, e.updated_at.date())
            for e in terminated
            if e.date_of_joining and e.updated_at
        ]

        # Leavers over time — bucket terminations by the month they were last
        # updated (proxy for termination date; see module docstring).
        month_keys = _last_months(months)
        leaver_counts: dict = defaultdict(int)
        for e in terminated:
            if e.updated_at:
                leaver_counts[_month_key(e.updated_at)] += 1
        leavers_trend = [
            {"month": k, "count": leaver_counts.get(k, 0)} for k in month_keys
        ]

        return {
            "headcount": headcount,
            "left": left,
            "turnover_rate": turnover_rate,
            "avg_tenure_years": round(sum(active_tenures) / len(active_tenures), 1)
            if active_tenures
            else None,
            "avg_tenure_at_exit_years": round(sum(exit_tenures) / len(exit_tenures), 1)
            if exit_tenures
            else None,
            "by_department": by_department,
            "leavers_trend": leavers_trend,
            "note": "Termination timing uses each employee's last-updated date as a proxy; add a dedicated termination date for exact figures.",
        }
