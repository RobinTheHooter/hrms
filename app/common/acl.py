"""Central access-control matrix. Mirrored by the frontend (src/features/auth/acl.js)."""

from enum import StrEnum

from app.common.enums import UserRole


class Permission(StrEnum):
    DASHBOARD_ADMIN = "dashboard:admin"
    DASHBOARD_HR = "dashboard:hr"
    DASHBOARD_EMPLOYEE = "dashboard:employee"
    EMPLOYEES_VIEW = "employees:view"
    EMPLOYEES_MANAGE = "employees:manage"
    USERS_MANAGE = "users:manage"
    SETTINGS_MANAGE = "settings:manage"


_HR_LIKE = {
    Permission.DASHBOARD_HR,
    Permission.DASHBOARD_EMPLOYEE,
    Permission.EMPLOYEES_VIEW,
    Permission.EMPLOYEES_MANAGE,
}

ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.ADMIN: set(Permission),  # all permissions
    UserRole.HR: set(_HR_LIKE),
    UserRole.MANAGER: set(_HR_LIKE),  # manager == hr for now
    UserRole.EMPLOYEE: {Permission.DASHBOARD_EMPLOYEE},
}


def role_has_permission(role: UserRole, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
