"""Central access-control matrix. Mirrored by the frontend (src/features/auth/acl.js)."""

from enum import StrEnum

from app.common.enums import UserRole


class Permission(StrEnum):
    USERS_MANAGE = "users:manage"
    JOBS_VIEW = "jobs:view"
    JOBS_MANAGE = "jobs:manage"
    CANDIDATES_VIEW = "candidates:view"
    CANDIDATES_MANAGE = "candidates:manage"
    # Move a candidate to a hiring-decision stage (offer / hired / rejected).
    CANDIDATES_DECIDE = "candidates:decide"
    INTERVIEWS_VIEW = "interviews:view"
    INTERVIEWS_SCHEDULE = "interviews:schedule"
    INTERVIEWS_CONDUCT = "interviews:conduct"
    EMPLOYEES_VIEW = "employees:view"
    EMPLOYEES_MANAGE = "employees:manage"


ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    # Super-admin: everything, including future permissions.
    UserRole.ADMIN: set(Permission),
    # HR Admin: full access to the ATS.
    UserRole.HR: set(Permission),
    # Recruiter: manages candidates on assigned jobs, books interviews.
    UserRole.CONSULTANT: {
        Permission.JOBS_VIEW,
        Permission.CANDIDATES_VIEW,
        Permission.CANDIDATES_MANAGE,
        Permission.INTERVIEWS_VIEW,
        Permission.INTERVIEWS_SCHEDULE,
    },
    # Hiring manager: conducts interviews and owns hiring decisions
    # (offer/hired/rejected), so they can manage and decide on candidates.
    UserRole.HIRING_MANAGER: {
        Permission.INTERVIEWS_VIEW,
        Permission.INTERVIEWS_CONDUCT,
        Permission.CANDIDATES_VIEW,
        Permission.CANDIDATES_MANAGE,
        Permission.CANDIDATES_DECIDE,
    },
    # Candidate: external (phase 2); no internal permissions.
    UserRole.CANDIDATE: set(),
}


def role_has_permission(role: UserRole, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
