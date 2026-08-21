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
