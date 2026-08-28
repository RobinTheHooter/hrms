import logging
import re
from datetime import datetime

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import CandidateSource, CandidateStage
from app.common.exceptions import AppError
from app.core.config import get_settings
from app.core.tasks import enqueue
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.candidates.service import CandidateService
from app.modules.screening.ai import score_resume
from app.modules.screening.extract import extract_text
from app.modules.screening.tasks import screen_candidate

settings = get_settings()
logger = logging.getLogger("hrms.screening")

_MAX_BYTES = 5_000_000
_MAX_TEXT = 20_000
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# Filename noise to strip when guessing a candidate name.
_NAME_NOISE = re.compile(r"\b(resume|cv|curriculum|vitae|final|updated|copy)\b", re.I)


def _find_email(text: str) -> str | None:
    m = _EMAIL_RE.search(text or "")
    return m.group(0).lower() if m else None


def _guess_name(filename: str) -> str:
    """Best-effort candidate name from the file name; consultant can fix later."""
    stem = re.sub(r"\.[^.]+$", "", filename or "").strip()
    stem = re.sub(r"[_\-]+", " ", stem)
    stem = _NAME_NOISE.sub("", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem.title() if stem else "Unknown candidate"


class ScreeningService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _run_score(self, candidate: Candidate) -> None:
        """Call the model and store results on the candidate. Raises on error."""
        job = candidate.job
        required = (job.required_skills or job.description) if job else None
        result = await score_resume(
            required, job.title if job else "", candidate.resume_text
        )
        candidate.ai_score = result["score"]
        candidate.ai_summary = result["summary"]
        candidate.ai_matched = result["matched"]
        candidate.ai_missing = result["missing"]
        candidate.ai_scored_at = datetime.utcnow()

    async def upload_resume(
        self, candidate_id: int, file: UploadFile, user: User
    ) -> Candidate:
        candidate = await CandidateService(self.db).get(candidate_id, user)
        data = await file.read()
        if len(data) > _MAX_BYTES:
            raise AppError("File too large (max 5 MB)")

        text = extract_text(file.filename or "", data)
        if not text.strip():
            raise AppError("Couldn't read any text from that file")

        candidate.resume_text = text[:_MAX_TEXT]
        # Keep the original file so it can be viewed/downloaded later.
        candidate.resume_data = data
        candidate.resume_filename = file.filename or "resume"
        candidate.resume_mime = file.content_type or "application/octet-stream"

        # Auto-screen in the background so the upload response returns
        # immediately. Commit the resume first so the job can read it, then
        # enqueue; the frontend polls and shows the score once it lands.
        if settings.AUTO_AI_SCREENING and settings.ai_enabled:
            await self.db.commit()
            enqueue(screen_candidate, candidate.id)

        return candidate

    async def bulk_upload(
        self, job_id: int, files: list[UploadFile], user: User
    ) -> dict:
        """Create one candidate per uploaded resume, then screen each in the
        background. Name/email are parsed best-effort (email from the resume
        text, name from the file name) so they can be corrected afterwards.
        """
        cs = CandidateService(self.db)
        job = await cs._job_or_404(job_id)
        cs._assert_can_touch_job(job, user)

        results: list[dict] = []
        new_ids: list[int] = []
        for file in files:
            try:
                data = await file.read()
                if len(data) > _MAX_BYTES:
                    raise AppError("File too large (max 5 MB)")
                text = extract_text(file.filename or "", data)
                if not text.strip():
                    raise AppError("Couldn't read any text from that file")

                email = _find_email(text) or f"import-{job_id}-{len(results) + 1}@unknown.local"
                candidate = Candidate(
                    job_id=job_id,
                    full_name=_guess_name(file.filename or ""),
                    email=email,
                    source=CandidateSource.APPLIED,
                    stage=CandidateStage.APPLIED,
                    created_by_id=user.id,
                    resume_text=text[:_MAX_TEXT],
                    resume_data=data,
                    resume_filename=file.filename or "resume",
                    resume_mime=file.content_type or "application/octet-stream",
                )
                self.db.add(candidate)
                await self.db.flush()
                new_ids.append(candidate.id)
                results.append(
                    {
                        "filename": file.filename,
                        "candidate_id": candidate.id,
                        "name": candidate.full_name,
                        "email": email,
                        "status": "created",
                    }
                )
            except Exception as exc:  # noqa: BLE001
                results.append(
                    {"filename": file.filename, "status": "failed", "error": str(exc)}
                )

        await self.db.commit()

        # Screen everything we created (background, best-effort).
        if settings.AUTO_AI_SCREENING and settings.ai_enabled:
            for cid in new_ids:
                enqueue(screen_candidate, cid)

        return {"total": len(files), "created": len(new_ids), "results": results}

    async def score(self, candidate_id: int, user: User) -> Candidate:
        """Manual (re)evaluation — surfaces errors to the caller."""
        if not settings.ai_enabled:
            raise AppError("AI screening is not configured on the server")
        candidate = await CandidateService(self.db).get(candidate_id, user)
        if not candidate.resume_text:
            raise AppError("Upload the candidate's resume first")
        try:
            await self._run_score(candidate)
        except Exception as exc:  # noqa: BLE001
            raise AppError(f"AI screening failed: {exc}") from exc
        return candidate
