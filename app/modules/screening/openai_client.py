import json

import httpx

from app.core.config import get_settings

settings = get_settings()

API_URL = "https://api.openai.com/v1/chat/completions"

_SYSTEM = (
    "You are an ATS resume-screening assistant. Given a job's required "
    "skills/keywords and a candidate's resume, assess the fit. Respond with "
    "STRICT JSON only, with these keys: "
    '"score" (integer 0-100), '
    '"matched" (array of the required skills clearly present in the resume), '
    '"missing" (array of required skills not found), '
    '"summary" (one short sentence justifying the score). '
    "Be objective; do not invent skills that are not in the resume."
)


async def score_resume(required: str | None, job_title: str, resume_text: str) -> dict:
    user = (
        f"Required skills/keywords:\n{required or 'Not specified'}\n\n"
        f"Job title: {job_title or 'N/A'}\n\n"
        f"Resume:\n{resume_text[:8000]}"
    )
    body = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user},
        ],
    }
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            API_URL,
            json=body,
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", {}).get("message") or resp.text
            except Exception:
                msg = resp.text
            raise RuntimeError(f"OpenAI {resp.status_code}: {msg}")
        data = resp.json()

    parsed = json.loads(data["choices"][0]["message"]["content"])
    score = int(parsed.get("score", 0))
    return {
        "score": max(0, min(100, score)),
        "matched": [str(x) for x in (parsed.get("matched") or [])],
        "missing": [str(x) for x in (parsed.get("missing") or [])],
        "summary": str(parsed.get("summary") or ""),
    }


_JD_SYSTEM = (
    "You are an expert technical recruiter writing job descriptions. Given a "
    "job title and optional hints (skills, seniority, employment type), write a "
    "clear, professional, inclusive job description. Respond with STRICT JSON "
    "only, with these keys: "
    '"description" (a well-structured description as plain text with line breaks: '
    "a short overview paragraph, then a line 'Key responsibilities:' followed by "
    "4-7 lines each starting with '- ', then a line 'Requirements:' followed by "
    "4-7 lines each starting with '- '), "
    '"required_skills" (array of 5-12 short skill keywords). '
    "Do not invent a company name, salary or benefits; keep it role-focused."
)


async def generate_job_description(
    title: str,
    skills: str | None,
    seniority: str | None,
    employment_type: str | None,
) -> dict:
    user = (
        f"Job title: {title}\n"
        f"Seniority: {seniority or 'Not specified'}\n"
        f"Employment type: {employment_type or 'Not specified'}\n"
        f"Skills / hints: {skills or 'Not specified'}"
    )
    body = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _JD_SYSTEM},
            {"role": "user", "content": user},
        ],
    }
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            API_URL,
            json=body,
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", {}).get("message") or resp.text
            except Exception:
                msg = resp.text
            raise RuntimeError(f"OpenAI {resp.status_code}: {msg}")
        data = resp.json()

    parsed = json.loads(data["choices"][0]["message"]["content"])
    return {
        "description": str(parsed.get("description") or "").strip(),
        "required_skills": [str(x) for x in (parsed.get("required_skills") or [])],
    }
