"""Provider-agnostic entry point for AI resume screening.

Backed by Gemini (see Settings.ai_provider); callers just import
`score_resume` / `generate_job_description` from here.
"""
from app.modules.screening import gemini_client


async def score_resume(required: str | None, job_title: str, resume_text: str) -> dict:
    return await gemini_client.score_resume(required, job_title, resume_text)


async def generate_job_description(
    title: str,
    skills: str | None = None,
    seniority: str | None = None,
    employment_type: str | None = None,
) -> dict:
    return await gemini_client.generate_job_description(
        title, skills, seniority, employment_type
    )


async def generate_interview_questions(
    title: str,
    skills: str | None = None,
    seniority: str | None = None,
    focus: str | None = None,
) -> dict:
    return await gemini_client.generate_interview_questions(
        title, skills, seniority, focus
    )


async def draft_candidate_email(
    kind: str,
    candidate_name: str | None = None,
    role: str | None = None,
    tone: str | None = None,
    notes: str | None = None,
) -> dict:
    return await gemini_client.draft_candidate_email(
        kind, candidate_name, role, tone, notes
    )


async def screening_insights(
    job_title: str,
    required: str | None,
    resume_text: str,
    score: int | None = None,
    matched: list | None = None,
    missing: list | None = None,
) -> dict:
    return await gemini_client.screening_insights(
        job_title, required, resume_text, score, matched, missing
    )
