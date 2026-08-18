// Mirror backend UserRole (app/common/enums.py).
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR Admin' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'hiring_manager', label: 'Hiring Manager' },
  { value: 'candidate', label: 'Candidate' },
]

export const roleLabel = (value) =>
  ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value

export const roleBadgeVariant = {
  admin: 'destructive',
  hr: 'default',
  consultant: 'info',
  hiring_manager: 'warning',
  candidate: 'secondary',
}
