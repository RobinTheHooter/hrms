// Badge variant per priority level (options themselves come from the backend).
const VARIANT = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'secondary',
}

export const priorityVariant = (value) => VARIANT[value] ?? 'secondary'
