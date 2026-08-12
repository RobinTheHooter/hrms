from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.employees.router import router as employees_router
from app.modules.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(employees_router)

# Register new module routers here as you build them.
