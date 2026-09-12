from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    OnboardingStatus,
    OnboardingTaskCategory,
    OnboardingTaskOwner,
    OnboardingTaskStatus,
)
from app.common.exceptions import ConflictError, NotFoundError
from app.common.pagination import Page, PageParams
from app.modules.auth.models import User
from app.modules.candidates.models import Candidate
from app.modules.employees.schemas import EmployeeCreate
from app.modules.employees.service import EmployeeService
from app.modules.offers.models import Offer
from app.modules.onboarding.models import Onboarding, OnboardingTask
from app.modules.onboarding.repository import OnboardingRepository
from app.modules.onboarding.schemas import (
    OnboardingConvert,
    OnboardingCreate,
    OnboardingListRead,
    OnboardingRead,
    OnboardingTaskCreate,
    OnboardingTaskUpdate,
    OnboardingUpdate,
)
from app.modules.onboarding.tasks_template import DEFAULT_CHECKLIST

# How many days before the start date each owner's tasks are due.
_LEAD_DAYS = {
    OnboardingTaskOwner.NEW_HIRE: 3,
    OnboardingTaskOwner.PEOPLE_OPS: 2,
    OnboardingTaskOwner.IT: 1,
    OnboardingTaskOwner.MANAGER: -1,  # day after joining
}


class OnboardingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = OnboardingRepository(db)

    # ------------------------------------------------------------------ reads
    async def list(
        self,
        params: PageParams,
        search: str | None = None,
        status: OnboardingStatus | None = None,
    ) -> Page[OnboardingListRead]:
        items, total = await self.repo.paginate(params, search=search, status=status)
        return Page.create(
            items=[OnboardingListRead.model_validate(o) for o in items],
            total=total,
            params=params,
        )

    async def get(self, onboarding_id: int) -> Onboarding:
        onboarding = await self.repo.get_by_id(onboarding_id)
        if onboarding is None:
            raise NotFoundError("Onboarding record not found")
        return onboarding

    # ---------------------------------------------------------------- creation
    def _build_tasks(self, start_date) -> list[OnboardingTask]:
        tasks: list[OnboardingTask] = []
        for position, (category, title, owner) in enumerate(DEFAULT_CHECKLIST):
            due_date = None
            if start_date is not None:
                lead = _LEAD_DAYS.get(owner, 0)
                due_date = start_date - timedelta(days=lead)
            tasks.append(
                OnboardingTask(
                    category=category,
                    title=title,
                    owner=owner,
                    status=OnboardingTaskStatus.PENDING,
                    due_date=due_date,
                    position=position,
                )
            )
        return tasks

    async def create(self, data: OnboardingCreate, user: User) -> Onboarding:
        payload = data.model_dump(
            exclude={"candidate_id", "offer_id", "seed_default_tasks"}
        )
        onboarding = Onboarding(
            **payload,
            candidate_id=data.candidate_id,
            offer_id=data.offer_id,
            status=OnboardingStatus.PRE_JOINING,
            created_by_id=user.id,
        )
        if data.candidate_id is not None:
            existing = await self.repo.get_by_candidate(data.candidate_id)
            if existing is not None:
                raise ConflictError(
                    "This candidate already has an onboarding record"
                )
        if data.seed_default_tasks:
            onboarding.tasks = self._build_tasks(data.start_date)
        return await self.repo.add(onboarding)

    async def create_from_offer(
        self, offer: Offer, user: User | None
    ) -> Onboarding | None:
        """Auto-create an onboarding record when an offer is accepted.

        Idempotent: returns the existing record if the candidate already has
        one. Candidate details are snapshotted from the offer's candidate.
        """
        candidate: Candidate = offer.candidate
        existing = await self.repo.get_by_candidate(candidate.id)
        if existing is not None:
            return existing

        job = getattr(candidate, "job", None)
        onboarding = Onboarding(
            candidate_id=candidate.id,
            offer_id=offer.id,
            full_name=candidate.full_name,
            email=candidate.email,
            job_title=candidate.current_role or offer.title or (job.title if job else None),
            department=job.department if job else None,
            location=job.location if job else None,
            start_date=offer.start_date,
            status=OnboardingStatus.PRE_JOINING,
            created_by_id=user.id if user else None,
        )
        onboarding.tasks = self._build_tasks(offer.start_date)
        return await self.repo.add(onboarding)

    # ---------------------------------------------------------------- mutations
    async def update(
        self, onboarding_id: int, data: OnboardingUpdate
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(onboarding, field, value)
        return onboarding

    async def set_status(
        self, onboarding_id: int, status: OnboardingStatus
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        onboarding.status = status
        return onboarding

    def _recompute_status(self, onboarding: Onboarding) -> None:
        # Never override terminal/manual states.
        if onboarding.status in (
            OnboardingStatus.COMPLETED,
            OnboardingStatus.CANCELLED,
        ):
            return
        done = onboarding.task_done
        total = onboarding.task_total
        if total and done == total:
            onboarding.status = OnboardingStatus.READY
        elif done > 0:
            onboarding.status = OnboardingStatus.IN_PROGRESS
        else:
            onboarding.status = OnboardingStatus.PRE_JOINING

    async def _get_task(
        self, onboarding: Onboarding, task_id: int
    ) -> OnboardingTask:
        for task in onboarding.tasks:
            if task.id == task_id:
                return task
        raise NotFoundError("Onboarding task not found")

    async def add_task(
        self, onboarding_id: int, data: OnboardingTaskCreate
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        position = (
            max((t.position for t in onboarding.tasks), default=-1) + 1
        )
        onboarding.tasks.append(
            OnboardingTask(
                category=data.category,
                title=data.title,
                owner=data.owner,
                status=OnboardingTaskStatus.PENDING,
                due_date=data.due_date,
                position=position,
            )
        )
        await self.db.flush()
        self._recompute_status(onboarding)
        await self.db.refresh(onboarding)
        return onboarding

    async def update_task(
        self, onboarding_id: int, task_id: int, data: OnboardingTaskUpdate
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        task = await self._get_task(onboarding, task_id)

        updates = data.model_dump(exclude_unset=True)
        new_status = updates.get("status")
        if new_status is not None and new_status != task.status:
            task.completed_at = (
                datetime.now(UTC)
                if new_status == OnboardingTaskStatus.DONE
                else None
            )
        for field, value in updates.items():
            setattr(task, field, value)

        self._recompute_status(onboarding)
        return onboarding

    async def delete_task(
        self, onboarding_id: int, task_id: int
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        task = await self._get_task(onboarding, task_id)
        onboarding.tasks.remove(task)
        await self.db.flush()
        self._recompute_status(onboarding)
        await self.db.refresh(onboarding)
        return onboarding

    # ---------------------------------------------------------------- convert
    async def convert_to_employee(
        self, onboarding_id: int, data: OnboardingConvert
    ) -> Onboarding:
        onboarding = await self.get(onboarding_id)
        if onboarding.employee_id is not None:
            raise ConflictError("This new hire is already an employee")

        doj = data.date_of_joining or onboarding.start_date
        if doj is None:
            raise ConflictError(
                "A joining date is required to create the employee record"
            )

        parts = onboarding.full_name.strip().split()
        first_name = parts[0] if parts else onboarding.full_name
        last_name = " ".join(parts[1:]) if len(parts) > 1 else first_name

        employee = await EmployeeService(self.db).create(
            EmployeeCreate(
                first_name=first_name,
                last_name=last_name,
                email=onboarding.email,
                job_title=data.job_title or onboarding.job_title or "—",
                department=data.department or onboarding.department,
                employment_type=data.employment_type,
                date_of_joining=doj,
            )
        )
        onboarding.employee_id = employee.id
        onboarding.status = OnboardingStatus.COMPLETED
        return onboarding
