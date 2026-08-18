// Option lists come from the backend (/meta/options). Only styling stays here.
export const statusVariant = (v) =>
  ({ scheduled: 'info', completed: 'success', cancelled: 'destructive' }[v] ??
  'secondary')

export const outcomeVariant = (v) =>
  ({ pending: 'secondary', selected: 'success', rejected: 'destructive' }[v] ??
  'secondary')

export const formatWhen = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
