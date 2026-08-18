export const CANDIDATE_STAGES = [
  { value: 'applied', label: 'Applied', variant: 'secondary' },
  { value: 'screening', label: 'Screening', variant: 'info' },
  { value: 'interview', label: 'Interview', variant: 'warning' },
  { value: 'offer', label: 'Offer', variant: 'default' },
  { value: 'hired', label: 'Hired', variant: 'success' },
  { value: 'rejected', label: 'Rejected', variant: 'destructive' },
]

export const CANDIDATE_SOURCES = [
  { value: 'applied', label: 'Applied' },
  { value: 'referral', label: 'Referral' },
  { value: 'sourced', label: 'Sourced' },
  { value: 'agency', label: 'Agency' },
]

export const stageMeta = (value) =>
  CANDIDATE_STAGES.find((s) => s.value === value) ?? {
    label: value,
    variant: 'secondary',
  }

export const labelOf = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value
