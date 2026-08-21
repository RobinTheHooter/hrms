"""Provider-agnostic entry point for AI resume screening.

Picks Gemini or OpenAI based on config (see Settings.ai_provider), so callers
just import `score_resume` from here and don't care which backend runs.
"""
from app.core.config import get_settings
from app.modules.screening import gemini_client, openai_client

settings = get_settings()


async def score_resume(required: str | None, job_title: str, resume_text: str) -> dict:
    if settings.ai_provider == "gemini":
        return await gemini_client.score_resume(required, job_title, resume_text)
    return await openai_client.score_resume(required, job_title, resume_text)
