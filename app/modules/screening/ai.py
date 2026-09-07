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
