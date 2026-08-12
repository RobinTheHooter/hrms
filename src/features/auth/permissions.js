import { PERMISSIONS, permissionsForRole } from '@/features/auth/acl'

/** Can this role create/update/delete employees? (mirrors employees:manage) */
export function canManageEmployees(role) {
  return permissionsForRole(role).includes(PERMISSIONS.EMPLOYEES_MANAGE)
}
