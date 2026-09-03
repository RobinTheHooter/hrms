export const PERMISSIONS = {
  USERS_MANAGE: 'users:manage',
  JOBS_VIEW: 'jobs:view',
  JOBS_MANAGE: 'jobs:manage',
  CANDIDATES_VIEW: 'candidates:view',
  CANDIDATES_MANAGE: 'candidates:manage',
  CANDIDATES_DECIDE: 'candidates:decide',
  INTERVIEWS_VIEW: 'interviews:view',
  INTERVIEWS_SCHEDULE: 'interviews:schedule',
  INTERVIEWS_CONDUCT: 'interviews:conduct',
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_MANAGE: 'employees:manage',
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
  // Hiring manager: conducts interviews and owns hiring decisions.
  hiring_manager: [
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_CONDUCT,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_MANAGE,
    PERMISSIONS.CANDIDATES_DECIDE,
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

export function landingPathFor(user) {
  // Everyone with any ATS access lands on the adaptive dashboard.
  if (user?.role && user.role !== 'candidate') return '/dashboard'
  return '/coming-soon'
}
