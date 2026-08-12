// Roles allowed to create/update/delete employees. Mirrors the backend
// require_roles(UserRole.ADMIN, UserRole.HR) guard on the employee routes.
export const EMPLOYEE_WRITE_ROLES = ['admin', 'hr']

export function canManageEmployees(role) {
  return EMPLOYEE_WRITE_ROLES.includes(role)
}
