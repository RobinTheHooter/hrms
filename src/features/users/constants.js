// Mirror backend UserRole (app/common/enums.py).
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

export const roleLabel = (value) =>
  ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value

export const roleBadgeVariant = {
  admin: 'destructive',
  hr: 'default',
  manager: 'warning',
  employee: 'secondary',
}
