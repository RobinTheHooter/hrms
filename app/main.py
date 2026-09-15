import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.common.exceptions import register_exception_handlers
from app.core.config import get_settings
from app.core.tasks import run_with_session

settings = get_settings()
logger = logging.getLogger("hrms.main")


async def _onboarding_reminder_job() -> None:
    from app.modules.onboarding.reminders import run_onboarding_reminders

    await run_with_session(run_onboarding_reminders)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the in-app onboarding reminder scheduler (APScheduler).

    Runs the daily reminder sweep inside the app process — no external cron.
    Controlled by ONBOARDING_REMINDERS_ENABLED (on by default). Disable only
    when running multiple instances, so the sweep runs once. Sends are
    idempotency-logged regardless.
    """
    scheduler = None
    if settings.ONBOARDING_REMINDERS_ENABLED:
        try:
            from apscheduler.schedulers.asyncio import AsyncIOScheduler
            from apscheduler.triggers.cron import CronTrigger

            scheduler = AsyncIOScheduler(timezone=settings.APP_TIMEZONE)
            scheduler.add_job(
                _onboarding_reminder_job,
                CronTrigger(hour=settings.ONBOARDING_REMINDER_HOUR, minute=0),
                id="onboarding_reminders",
                replace_existing=True,
            )
            scheduler.start()
            logger.info(
                "Onboarding reminder scheduler started (daily at %02d:00 %s)",
                settings.ONBOARDING_REMINDER_HOUR,
                settings.APP_TIMEZONE,
            )
        except Exception:  # noqa: BLE001
            logger.exception("Failed to start onboarding reminder scheduler")
            scheduler = None
    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.shutdown(wait=False)


app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
