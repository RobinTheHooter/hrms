from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.candidates.router import router as candidates_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.integrations.router import router as integrations_router
from app.modules.interviews.router import router as interviews_router
from app.modules.jobs.router import router as jobs_router
from app.modules.meta.router import router as meta_router
from app.modules.notifications.router import router as notifications_router
from app.modules.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(meta_router)
api_router.include_router(dashboard_router)
api_router.include_router(users_router)
api_router.include_router(jobs_router)
api_router.include_router(candidates_router)
api_router.include_router(interviews_router)
api_router.include_router(integrations_router)
api_router.include_router(notifications_router)

# Employees module is hidden for the ATS pivot (files kept for later):
#   from app.modules.employees.router import router as employees_router
#   api_router.include_router(employees_router)
