from fastapi import APIRouter

from app.modules.auth.router import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)

# Register new module routers here as you build them:
# api_router.include_router(employees_router)
