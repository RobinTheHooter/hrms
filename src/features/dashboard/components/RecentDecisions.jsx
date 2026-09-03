import { CalendarClock, Star, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/panel'
import { useRecentDecisions } from '@/features/dashboard/hooks'
import { priorityVariant } from '@/lib/priority'

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
const RECOMMENDATION = {
  strong_yes: { label: 'Strong Yes', variant: 'success' },
  yes: { label: 'Yes', variant: 'success' },
  no: { label: 'No', variant: 'destructive' },
  strong_no: { label: 'Strong No', variant: 'destructive' },
}

const cap = (s) =>
  String(s ?? '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''
const avgRating = (ratings) => {
  const vals = Object.values(ratings ?? {}).filter((v) => v)
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function DecisionLabel({ d }) {
  const fb = d.feedback ?? {}
  return NEXT_STEP[fb.next_step] ?? OUTCOME[d.outcome] ?? { label: cap(d.outcome), variant: 'secondary' }
}

export function RecentDecisions() {
  const { data = [] } = useRecentDecisions(12)
  if (data.length === 0) return null

  // Summary counts across the shown decisions.
  const counts = data.reduce((acc, d) => {
    const key = d.feedback?.next_step ?? d.outcome
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const summary = [
    ['join', 'to join'],
    ['next_round', 'next round'],
    ['on_hold', 'on hold'],
    ['rejected', 'rejected'],
  ].filter(([k]) => counts[k])

  return (
    <Panel title="Recent hiring decisions">
      {summary.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 border-b pb-3">
          {summary.map(([k, label]) => (
            <span
              key={k}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {counts[k]} {label}
            </span>
          ))}
        </div>
      )}

      <ul className="divide-y">
        {data.map((d) => {
          const fb = d.feedback ?? {}
          const decision = DecisionLabel({ d })
          const rec = RECOMMENDATION[fb.recommendation]
          const avg = avgRating(fb.ratings)
          return (
            <li key={d.interview_id} className="flex gap-3 py-3">
              <Avatar name={d.candidate_name} size="sm" />
              <div className="min-w-0 flex-1">
                {/* Title row */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to={`/candidates/${d.candidate_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {d.candidate_name}
                  </Link>
                  <Badge variant={decision.variant}>{decision.label}</Badge>
                  {rec && <Badge variant={rec.variant}>{rec.label}</Badge>}
                  {d.priority && (
                    <Badge variant={priorityVariant(d.priority)}>{cap(d.priority)}</Badge>
                  )}
                </div>

                {/* Meta row */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{d.job_title}</span>
                  {d.hiring_manager && (
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" />
                      {d.hiring_manager}
                    </span>
                  )}
                  {d.decided_at && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      {fmtDate(d.decided_at)}
                    </span>
                  )}
                  {avg && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3" />
                      {avg}/5
                    </span>
                  )}
                  {d.stage && <span>Stage: {cap(d.stage)}</span>}
                </div>

                {/* Join details */}
                {fb.next_step === 'join' &&
                  (fb.tentative_joining_date || fb.estimated_ctc != null) && (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                      {fb.tentative_joining_date && (
                        <span>
                          <span className="text-muted-foreground">Joining: </span>
                          {fb.tentative_joining_date}
                        </span>
                      )}
                      {fb.estimated_ctc != null && (
                        <span>
                          <span className="text-muted-foreground">Est. CTC: </span>
                          {fb.estimated_ctc.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}

                {/* Next-round / on-hold note */}
                {fb.next_step_note && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {fb.next_step_note}
                  </p>
                )}

                {/* Strengths / concerns snippets */}
                {(fb.strengths || fb.concerns) && (
                  <div className="mt-1 space-y-0.5 text-xs">
                    {fb.strengths && (
                      <p className="line-clamp-1">
                        <span className="text-success">+ </span>
                        {fb.strengths}
                      </p>
                    )}
                    {fb.concerns && (
                      <p className="line-clamp-1">
                        <span className="text-destructive">− </span>
                        {fb.concerns}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection reason */}
                {d.outcome === 'rejected' && d.reason && (
                  <p className="mt-1 line-clamp-2 text-xs text-destructive">{d.reason}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
