from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    CandidateStage,
    InterviewOutcome,
    InterviewStatus,
    UserRole,
)
from app.common.exceptions import AppError, NotFoundError, PermissionError
from app.common.pagination import Page, PageParams
from app.core.config import get_settings
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.integrations.calendar import GoogleCalendarService

settings = get_settings()
from app.modules.interviews.models import Interview
from app.modules.interviews.repository import InterviewRepository
from app.modules.interviews.schemas import (
    InterviewCreate,
    InterviewFeedbackUpdate,
    InterviewOutcomeUpdate,
    InterviewRead,
    InterviewUpdate,
)


class InterviewService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = InterviewRepository(db)

    @staticmethod
    def _scope(user: User) -> tuple[int | None, int | None]:
        """(consultant_id, manager_id) filters based on role."""
        if user.role == UserRole.CONSULTANT:
            return user.id, None
        if user.role == UserRole.HIRING_MANAGER:
            return None, user.id
        return None, None  # hr / admin see all

    def _assert_visible(self, interview: Interview, user: User) -> None:
        if (
            user.role == UserRole.CONSULTANT
            and interview.candidate.job.assigned_consultant_id != user.id
        ):
            raise NotFoundError("Interview not found")
        if (
            user.role == UserRole.HIRING_MANAGER
            and interview.hiring_manager_id != user.id
        ):
            raise NotFoundError("Interview not found")

    async def list(
        self,
        user: User,
        params: PageParams,
        status: InterviewStatus | None = None,
    ) -> Page[InterviewRead]:
        consultant_id, manager_id = self._scope(user)
        items, total = await self.repo.paginate(
            params, status=status, consultant_id=consultant_id, manager_id=manager_id
        )
        return Page.create(
            items=[InterviewRead.model_validate(i) for i in items],
            total=total,
            params=params,
        )

    async def get(self, interview_id: int, user: User) -> Interview:
        interview = await self.repo.get_by_id(interview_id)
        if interview is None:
            raise NotFoundError("Interview not found")
        self._assert_visible(interview, user)
        return interview

    async def create(self, data: InterviewCreate, user: User) -> Interview:
        candidate = await self.db.get(Candidate, data.candidate_id)
        if candidate is None:
            raise NotFoundError("Candidate not found")
        # Consultants may only schedule for candidates on their assigned jobs.
        if (
            user.role == UserRole.CONSULTANT
            and candidate.job.assigned_consultant_id != user.id
        ):
            raise PermissionError("This candidate is not on your job")

        interview = Interview(**data.model_dump(), created_by_id=user.id)
        interview = await self.repo.create(interview)

        # Move the candidate into the interview stage.
        if candidate.stage in (CandidateStage.APPLIED, CandidateStage.SCREENING):
            candidate.stage = CandidateStage.INTERVIEW

        # Sync to the manager's Google Calendar (best-effort).
        if settings.google_enabled and interview.hiring_manager_id:
            eid, link = await GoogleCalendarService(self.db).create_event_for(
                interview.hiring_manager_id, **self._event_data(interview, candidate)
            )
            if eid:
                interview.google_event_id = eid
                interview.meeting_link = link
        return interview

    def _event_data(self, interview: Interview, candidate: Candidate) -> dict:
        job_title = candidate.job.title if candidate.job else ""
        summary = f"Interview: {candidate.full_name}"
        if job_title:
            summary += f" — {job_title}"
        return {
            "summary": summary,
            "description": interview.notes or "",
            "start_dt": interview.scheduled_at,
            "mode": interview.mode,
            "location": interview.location_or_link,
            "attendee_emails": [candidate.email],
        }

    async def _sync_update(
        self, interview: Interview, old_manager_id, old_event_id
    ) -> None:
        svc = GoogleCalendarService(self.db)
        new_manager = interview.hiring_manager_id
        data = self._event_data(interview, interview.candidate)

        if interview.status == InterviewStatus.CANCELLED:
            if old_event_id and old_manager_id:
                await svc.delete_event_for(old_manager_id, old_event_id)
            interview.google_event_id = None
            interview.meeting_link = None
            return

        if old_event_id and old_manager_id == new_manager:
            _, link = await svc.update_event_for(new_manager, old_event_id, **data)
            if link:
                interview.meeting_link = link
        elif old_event_id and old_manager_id != new_manager:
            if old_manager_id:
                await svc.delete_event_for(old_manager_id, old_event_id)
            if new_manager:
                eid, link = await svc.create_event_for(new_manager, **data)
                interview.google_event_id = eid
                interview.meeting_link = link
            else:
                interview.google_event_id = None
                interview.meeting_link = None
        elif not old_event_id and new_manager:
            eid, link = await svc.create_event_for(new_manager, **data)
            interview.google_event_id = eid
            interview.meeting_link = link

    async def update(
        self, interview_id: int, data: InterviewUpdate, user: User
    ) -> Interview:
        interview = await self.get(interview_id, user)
        old_manager_id = interview.hiring_manager_id
        old_event_id = interview.google_event_id

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(interview, field, value)

        if settings.google_enabled:
            await self._sync_update(interview, old_manager_id, old_event_id)
        return interview

    async def record_outcome(
        self, interview_id: int, data: InterviewOutcomeUpdate, user: User
    ) -> Interview:
        interview = await self.get(interview_id, user)
        # A reason is mandatory when rejecting.
        if data.outcome == InterviewOutcome.REJECTED and not (
            data.notes and data.notes.strip()
        ):
            raise AppError("A reason is required when rejecting a candidate")
        interview.outcome = data.outcome
        interview.status = InterviewStatus.COMPLETED
        if data.notes is not None:
            interview.notes = data.notes
        if data.feedback is not None:
            interview.feedback = data.feedback.model_dump(exclude_none=True)

        # Reflect the outcome back onto the candidate's pipeline stage, but only
        # for the candidate's most recent interview. The next-step decision
        # decides how far they move: only "join" advances them to Offer; a next
        # round keeps them in the interview pipeline; on-hold leaves them as-is.
        if await self._is_latest_interview(interview):
            candidate = interview.candidate
            next_step = data.feedback.next_step if data.feedback else None
            if data.outcome == InterviewOutcome.REJECTED:
                candidate.stage = CandidateStage.REJECTED
            elif data.outcome == InterviewOutcome.SELECTED and next_step == "join":
                candidate.stage = CandidateStage.OFFER
            # next_round / on_hold / no next_step -> leave the stage unchanged.
        return interview

    async def set_feedback(
        self, interview_id: int, data: "InterviewFeedbackUpdate", user: User
    ) -> Interview:
        """Add or edit feedback independent of the outcome — available any time,
        including after the interview is completed."""
        interview = await self.get(interview_id, user)
        interview.feedback = data.feedback.model_dump(exclude_none=True)
        if data.notes is not None:
            interview.notes = data.notes
        return interview

    async def _is_latest_interview(self, interview: Interview) -> bool:
        """True if no other interview for the candidate is scheduled later."""
        newer = await self.db.scalar(
            select(func.count(Interview.id)).where(
                Interview.candidate_id == interview.candidate_id,
                Interview.id != interview.id,
                Interview.scheduled_at > interview.scheduled_at,
            )
        )
        return not newer

    async def delete(self, interview_id: int, user: User) -> None:
        interview = await self.get(interview_id, user)
        if (
            settings.google_enabled
            and interview.google_event_id
            and interview.hiring_manager_id
        ):
            await GoogleCalendarService(self.db).delete_event_for(
                interview.hiring_manager_id, interview.google_event_id
            )
        await self.repo.delete(interview)
