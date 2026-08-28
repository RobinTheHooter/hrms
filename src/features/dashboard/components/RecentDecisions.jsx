import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/panel'
import { useRecentDecisions } from '@/features/dashboard/hooks'

const NEXT_STEP = {
  join: { label: 'Selected to join', variant: 'success' },
  next_round: { label: 'Next round', variant: 'info' },
  on_hold: { label: 'On hold', variant: 'warning' },
}
const OUTCOME = {
  selected: { label: 'Selected', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'secondary' },
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''

export function RecentDecisions() {
  const { data = [] } = useRecentDecisions(12)
  if (data.length === 0) return null

  return (
    <Panel title="Recent hiring decisions">
      <ul className="divide-y">
        {data.map((d) => {
          const fb = d.feedback ?? {}
          const step = NEXT_STEP[fb.next_step]
          const outcome = OUTCOME[d.outcome]
          return (
            <li key={d.interview_id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link
                  to={`/candidates/${d.candidate_id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {d.candidate_name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {d.job_title}
                  {d.hiring_manager ? ` · ${d.hiring_manager}` : ''}
                  {d.decided_at ? ` · ${fmtDate(d.decided_at)}` : ''}
                </div>
                {fb.next_step === 'join' &&
                  (fb.tentative_joining_date || fb.estimated_ctc != null) && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {fb.tentative_joining_date && `Joining ${fb.tentative_joining_date}`}
                      {fb.tentative_joining_date && fb.estimated_ctc != null ? ' · ' : ''}
                      {fb.estimated_ctc != null &&
                        `CTC ${fb.estimated_ctc.toLocaleString('en-IN')}`}
                    </div>
                  )}
                {fb.next_step_note && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {fb.next_step_note}
                  </p>
                )}
              </div>
              <Badge variant={(step ?? outcome)?.variant}>
                {(step ?? outcome)?.label}
              </Badge>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
