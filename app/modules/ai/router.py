from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.acl import Permission
from app.core.config import get_settings
from app.core.database import get_db
from app.modules.ai.schemas import (
    EmailDraftRequest,
    EmailDraftResponse,
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    ScreeningInsightsRequest,
    ScreeningInsightsResponse,
)
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.auth.models import User
from app.modules.candidates.service import CandidateService
from app.modules.screening import ai as screening_ai

router = APIRouter(prefix="/ai", tags=["ai"])

CurrentUser = Annotated[User, Depends(get_current_user)]
CandidatesViewer = Annotated[User, Depends(require_permission(Permission.CANDIDATES_VIEW))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


def _require_ai() -> None:
    if not get_settings().ai_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features aren't configured on the server yet.",
        )


def _ai_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The AI service didn't respond. Please try again.",
    )


@router.post("/interview-questions", response_model=InterviewQuestionsResponse)
async def interview_questions(
    payload: InterviewQuestionsRequest, current_user: CurrentUser
) -> InterviewQuestionsResponse:
    """Generate tailored technical + behavioral interview questions for a role."""
    _require_ai()
    try:
        result = await screening_ai.generate_interview_questions(
            payload.title, payload.skills, payload.seniority, payload.focus
        )
    except Exception:
        raise _ai_error()
    return InterviewQuestionsResponse(**result)


@router.post("/email-draft", response_model=EmailDraftResponse)
async def email_draft(
    payload: EmailDraftRequest, current_user: CurrentUser
) -> EmailDraftResponse:
    """Draft a candidate email (outreach / rejection / nudge) in a chosen tone."""
    _require_ai()
    try:
        result = await screening_ai.draft_candidate_email(
            payload.kind,
            payload.candidate_name,
            payload.role,
            payload.tone,
            payload.notes,
        )
    except Exception:
        raise _ai_error()
    return EmailDraftResponse(**result)


@router.post("/screening-insights", response_model=ScreeningInsightsResponse)
async def screening_insights(
    payload: ScreeningInsightsRequest,
    current_user: CandidatesViewer,
    db: DbSession,
) -> ScreeningInsightsResponse:
    """Explain a candidate's fit score and suggest targeted follow-up questions."""
    _require_ai()
    candidate = await CandidateService(db).get(payload.candidate_id, current_user)
    if not candidate.resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This candidate has no resume text to analyse yet.",
        )
    job = getattr(candidate, "job", None)
    try:
        result = await screening_ai.screening_insights(
            job_title=job.title if job else "",
            required=(job.required_skills if job else None) or candidate.skills,
            resume_text=candidate.resume_text,
            score=candidate.ai_score,
            matched=candidate.ai_matched,
            missing=candidate.ai_missing,
        )
    except Exception:
        raise _ai_error()
    return ScreeningInsightsResponse(**result)
