// Mirrors the backend ACL (app/common/acl.py). The backend is the real
// security boundary; this drives UX (routes, nav, buttons).

export const PERMISSIONS = {
  DASHBOARD_ADMIN: 'dashboard:admin',
  DASHBOARD_HR: 'dashboard:hr',
  DASHBOARD_EMPLOYEE: 'dashboard:employee',
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_MANAGE: 'employees:manage',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
}

const ALL = Object.values(PERMISSIONS)

const HR_LIKE = [
  PERMISSIONS.DASHBOARD_HR,
  PERMISSIONS.DASHBOARD_EMPLOYEE,
  PERMISSIONS.EMPLOYEES_VIEW,
  PERMISSIONS.EMPLOYEES_MANAGE,
]

export const ROLE_PERMISSIONS = {
  admin: ALL,
  hr: HR_LIKE,
  manager: HR_LIKE,
  employee: [PERMISSIONS.DASHBOARD_EMPLOYEE],
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? []
}

/** Does this user hold the given permission? */
export function can(user, permission) {
  if (!user || !permission) return false
  return permissionsForRole(user.role).includes(permission)
}

/** The default route a user should land on, based on their permissions. */
export function landingPathFor(user) {
  const perms = permissionsForRole(user?.role)
  if (perms.includes(PERMISSIONS.DASHBOARD_ADMIN)) return '/dashboard'
  if (perms.includes(PERMISSIONS.DASHBOARD_HR)) return '/hr-dashboard'
  return '/employee-dashboard'
}
