// Option lists come from the backend (/meta/options). Only styling stays here.
export const statusVariant = (v) =>
  ({ scheduled: 'info', completed: 'success', cancelled: 'destructive' }[v] ??
  'secondary')

export const outcomeVariant = (v) =>
  ({ pending: 'secondary', selected: 'success', rejected: 'destructive' }[v] ??
  'secondary')

// Interview times are stored as naive IST wall-clock values, so we render the
// components directly (no Date() timezone conversion, which would shift the
// time on non-IST devices).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatWhen = (iso) => {
  if (!iso) return '—'
  const [datePart, timePart = ''] = iso.split('T')
  const [y, mo, da] = datePart.split('-').map(Number)
  let [hh, mi] = timePart.split(':').map(Number)
  hh = Number.isNaN(hh) ? 0 : hh
  mi = Number.isNaN(mi) ? 0 : mi
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const h12 = ((hh + 11) % 12) + 1
  return `${da} ${MONTHS[mo - 1]} ${y}, ${h12}:${String(mi).padStart(2, '0')} ${ampm} IST`
}

// datetime-local expects "YYYY-MM-DDTHH:MM" — which the stored value already is.
export const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '')
