// Option lists come from the backend (/meta/options). Only styling stays here.
const STAGE_VARIANT = {
  applied: 'secondary',
  screening: 'info',
  interview: 'warning',
  offer: 'default',
  hired: 'success',
  rejected: 'destructive',
}

export const stageVariant = (value) => STAGE_VARIANT[value] ?? 'secondary'

// Hiring-decision stages — only users with CANDIDATES_DECIDE (HR/admin) may
// move a candidate to these; locked for consultants. Mirrors the backend.
export const DECISION_STAGES = ['offer', 'hired', 'rejected']
