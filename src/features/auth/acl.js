// Mirrors the backend ACL (app/common/acl.py). The backend is the real
// security boundary; this drives UX (routes, nav, buttons).

export const PERMISSIONS = {
  USERS_MANAGE: 'users:manage',
  JOBS_VIEW: 'jobs:view',
  JOBS_MANAGE: 'jobs:manage',
  CANDIDATES_VIEW: 'candidates:view',
  CANDIDATES_MANAGE: 'candidates:manage',
  INTERVIEWS_VIEW: 'interviews:view',
  INTERVIEWS_SCHEDULE: 'interviews:schedule',
  INTERVIEWS_CONDUCT: 'interviews:conduct',
}

const ALL = Object.values(PERMISSIONS)

export const ROLE_PERMISSIONS = {
  // Super-admin and HR Admin: full access.
  admin: ALL,
  hr: ALL,
  // Recruiter: candidates on assigned jobs + booking interviews.
  consultant: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_MANAGE,
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_SCHEDULE,
  ],
  // Hiring manager: conducts interviews, views candidates.
  hiring_manager: [
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_CONDUCT,
    PERMISSIONS.CANDIDATES_VIEW,
  ],
  // Candidate: external (phase 2).
  candidate: [],
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? []
}

/** Does this user hold the given permission? */
export function can(user, permission) {
  if (!user || !permission) return false
  return permissionsForRole(user.role).includes(permission)
}

/**
 * Default route for a user. ATS screens aren't built yet, so admins/HR land
 * on User Management and everyone else on a placeholder until we ship them.
 */
export function landingPathFor(user) {
  if (can(user, PERMISSIONS.JOBS_VIEW)) return '/jobs'
  if (can(user, PERMISSIONS.USERS_MANAGE)) return '/users'
  return '/coming-soon'
}
