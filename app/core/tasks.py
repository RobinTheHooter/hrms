"""Lightweight background task runner.

The single integration point for offloading slow, best-effort work (AI
screening, email, calendar sync) off the request path so responses return
immediately. `enqueue()` fires a coroutine on the running event loop; errors
are logged, never raised into the caller.

This is intentionally minimal and in-process. The public surface —
`enqueue()` and `run_with_session()` — is what call sites depend on, so it can
be swapped for a durable queue (arq/Celery/RQ) later without touching them.

Caveat: in-process tasks do not survive a restart. That's acceptable for the
current best-effort side-effects; move to a durable queue before relying on
background work for anything that must not be lost.
"""
import asyncio
import logging
from collections.abc import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal

logger = logging.getLogger("hrms.tasks")

# Keep strong references so fire-and-forget tasks aren't garbage-collected
# before they finish.
_tasks: set[asyncio.Task] = set()


def enqueue(func: Callable[..., Awaitable[None]], *args, **kwargs) -> None:
    """Schedule background work (fire-and-forget). Never raises into caller."""

    async def _runner() -> None:
        try:
            await func(*args, **kwargs)
        except Exception:  # noqa: BLE001
            logger.exception(
                "Background task %r failed", getattr(func, "__name__", func)
            )

    try:
        task = asyncio.create_task(_runner())
    except RuntimeError:
        # No running loop (e.g. called from a sync context) — run inline.
        asyncio.run(_runner())
        return
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)


async def run_with_session(
    work: Callable[[AsyncSession], Awaitable[None]],
) -> None:
    """Run background work in its own committed DB session.

    Background jobs can't reuse the request's session (it's closed once the
    response is sent), so each opens a fresh one here.
    """
    async with AsyncSessionLocal() as session:
        try:
            await work(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise
