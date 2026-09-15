import { FileText, GraduationCap, Laptop, ShieldCheck } from 'lucide-react'

// Mirror the backend enums (app/common/enums.py). Only labels/styling here.
export const ONBOARDING_STATUSES = [
  { value: 'pre_joining', label: 'Pre-joining' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_VARIANT = {
  pre_joining: 'secondary',
  in_progress: 'info',
  ready: 'success',
  completed: 'default',
  cancelled: 'destructive',
}

export const statusVariant = (value) => STATUS_VARIANT[value] ?? 'secondary'

// Categories in display order, each with an icon + tone token.
export const TASK_CATEGORIES = [
  { value: 'documentation', label: 'Documentation', icon: FileText, tone: 'info' },
  { value: 'hr_compliance', label: 'HR & Compliance', icon: ShieldCheck, tone: 'primary' },
  { value: 'it_access', label: 'IT & Access', icon: Laptop, tone: 'success' },
  { value: 'orientation', label: 'Orientation & Manager', icon: GraduationCap, tone: 'warning' },
]

export const OWNER_LABELS = {
  people_ops: 'People Ops',
  it: 'IT',
  manager: 'Manager',
  new_hire: 'New hire',
}

export const TASK_OWNERS = [
  { value: 'people_ops', label: 'People Ops' },
  { value: 'it', label: 'IT' },
  { value: 'manager', label: 'Manager' },
  { value: 'new_hire', label: 'New hire' },
]

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]

export const labelOf = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value

/** "15 Sep 2026" from an ISO date string, or "—". */
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Whole days from today to the given date (negative if past). */
export function daysUntil(value) {
  if (!value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

/** Friendly countdown label for a start date. */
export function countdownLabel(value) {
  const d = daysUntil(value)
  if (d === null) return null
  if (d > 1) return `${d} days to go`
  if (d === 1) return 'Joins tomorrow'
  if (d === 0) return 'Joins today'
  if (d === -1) return 'Joined yesterday'
  return `Joined ${Math.abs(d)} days ago`
}
