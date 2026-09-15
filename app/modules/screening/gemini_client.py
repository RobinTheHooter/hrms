import json

import httpx

from app.core.config import get_settings

settings = get_settings()

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

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
        "system_instruction": {"parts": [{"text": _SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
        },
    }
    url = f"{API_BASE}/{settings.GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", {}).get("message") or resp.text
            except Exception:
                msg = resp.text
            raise RuntimeError(f"Gemini {resp.status_code}: {msg}")
        data = resp.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)
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
        "system_instruction": {"parts": [{"text": _JD_SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }
    url = f"{API_BASE}/{settings.GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", {}).get("message") or resp.text
            except Exception:
                msg = resp.text
            raise RuntimeError(f"Gemini {resp.status_code}: {msg}")
        data = resp.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)
    return {
        "description": str(parsed.get("description") or "").strip(),
        "required_skills": [str(x) for x in (parsed.get("required_skills") or [])],
    }


async def _call_gemini_json(system: str, user: str, temperature: float = 0.4) -> dict:
    """Shared helper: send a system+user prompt, return parsed JSON."""
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }
    url = f"{API_BASE}/{settings.GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            url, json=body, headers={"x-goog-api-key": settings.GEMINI_API_KEY}
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", {}).get("message") or resp.text
            except Exception:
                msg = resp.text
            raise RuntimeError(f"Gemini {resp.status_code}: {msg}")
        data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)


_IQ_SYSTEM = (
    "You are an expert technical interviewer. Given a role and optional hints, "
    "produce a focused set of interview questions. Respond with STRICT JSON only, "
    'with keys: "technical" (array of 5-8 role-specific technical questions) and '
    '"behavioral" (array of 4-6 behavioral/situational questions). Keep each '
    "question to one clear sentence; do not number them."
)


async def generate_interview_questions(
    title: str,
    skills: str | None,
    seniority: str | None,
    focus: str | None,
) -> dict:
    user = (
        f"Role: {title}\n"
        f"Seniority: {seniority or 'Not specified'}\n"
        f"Key skills: {skills or 'Not specified'}\n"
        f"Focus area (optional): {focus or 'General'}"
    )
    parsed = await _call_gemini_json(_IQ_SYSTEM, user, temperature=0.5)
    return {
        "technical": [str(x) for x in (parsed.get("technical") or [])],
        "behavioral": [str(x) for x in (parsed.get("behavioral") or [])],
    }


_EMAIL_SYSTEM = (
    "You are a recruiter writing a short, warm, professional email to a "
    "candidate. Given the email type, candidate name, role, tone and optional "
    "notes, write it. Respond with STRICT JSON only, with keys: "
    '"subject" (a concise subject line) and "body" (the email body as plain '
    "text with line breaks, signed off generically as 'the hiring team' unless "
    "notes say otherwise). Do not invent salary, dates, or commitments not "
    "given in the notes. Keep it human and specific, not templated."
)


async def draft_candidate_email(
    kind: str,
    candidate_name: str | None,
    role: str | None,
    tone: str | None,
    notes: str | None,
) -> dict:
    user = (
        f"Email type: {kind}\n"
        f"Candidate name: {candidate_name or 'the candidate'}\n"
        f"Role: {role or 'the role'}\n"
        f"Tone: {tone or 'friendly and professional'}\n"
        f"Notes/context: {notes or 'None'}"
    )
    parsed = await _call_gemini_json(_EMAIL_SYSTEM, user, temperature=0.6)
    return {
        "subject": str(parsed.get("subject") or "").strip(),
        "body": str(parsed.get("body") or "").strip(),
    }


_INSIGHTS_SYSTEM = (
    "You are an ATS assistant helping an interviewer prepare. Given a job, its "
    "required skills, a candidate's resume, and a prior fit score, explain the "
    "assessment and suggest how to probe further. Respond with STRICT JSON only, "
    'with keys: "rationale" (2-3 sentences explaining the score), "strengths" '
    '(array of 3-5 concrete strengths from the resume), "gaps" (array of 2-4 '
    'concerns or unknowns to verify) and "follow_up_questions" (array of 4-6 '
    "targeted questions to ask this specific candidate). Base everything on the "
    "resume; do not invent experience."
)


async def screening_insights(
    job_title: str,
    required: str | None,
    resume_text: str,
    score: int | None,
    matched: list | None,
    missing: list | None,
) -> dict:
    user = (
        f"Job title: {job_title or 'N/A'}\n"
        f"Required skills: {required or 'Not specified'}\n"
        f"Prior fit score: {score if score is not None else 'N/A'}\n"
        f"Matched skills: {', '.join(matched or []) or 'None recorded'}\n"
        f"Missing skills: {', '.join(missing or []) or 'None recorded'}\n\n"
        f"Resume:\n{resume_text[:8000]}"
    )
    parsed = await _call_gemini_json(_INSIGHTS_SYSTEM, user, temperature=0.3)
    return {
        "rationale": str(parsed.get("rationale") or "").strip(),
        "strengths": [str(x) for x in (parsed.get("strengths") or [])],
        "gaps": [str(x) for x in (parsed.get("gaps") or [])],
        "follow_up_questions": [
            str(x) for x in (parsed.get("follow_up_questions") or [])
        ],
    }
