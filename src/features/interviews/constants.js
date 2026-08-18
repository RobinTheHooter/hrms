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

// Current moment as an IST "YYYY-MM-DDTHH:MM" string, for the picker's min.
export function nowInputIST() {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const g = (t) => p.find((x) => x.type === t)?.value
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`
}

const pad = (n) => String(n).padStart(2, '0')
const gcalStamp = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

/**
 * Build a Google Calendar "add event" link. `scheduledAt` is a naive IST
 * wall-clock string; we tag the link with ctz=Asia/Kolkata so Google reads
 * the times as IST. Default duration 60 min.
 */
export function googleCalendarUrl({ title, scheduledAt, details, location }) {
  const [datePart, timePart = ''] = (scheduledAt || '').split('T')
  const [y, mo, da] = datePart.split('-').map(Number)
  const [hh, mi] = timePart.split(':').map(Number)
  const start = new Date(y, (mo || 1) - 1, da || 1, hh || 0, mi || 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Interview',
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    ctz: 'Asia/Kolkata',
  })
  if (details) params.set('details', details)
  if (location) params.set('location', location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
