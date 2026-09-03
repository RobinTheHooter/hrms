import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { useConsultantBreakdown } from '@/features/dashboard/hooks'

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="truncate text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function ConsultantBreakdown() {
  const navigate = useNavigate()
  const { data = [], isLoading } = useConsultantBreakdown(true)
  const [open, setOpen] = useState({})
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  const { rows, totals } = useMemo(() => {
    const totalSubmitted = data.reduce((s, c) => s + c.submitted, 0)
    const maxSubmitted = Math.max(1, ...data.map((c) => c.submitted))
    const rows = [...data]
      .sort(
        (a, b) => b.submitted - a.submitted || b.total_candidates - a.total_candidates,
      )
      .map((c) => ({
        ...c,
        share: totalSubmitted ? Math.round((c.submitted / totalSubmitted) * 100) : 0,
        avgPerRole: c.total_jobs ? c.total_candidates / c.total_jobs : 0,
        barPct: Math.round((c.submitted / maxSubmitted) * 100),
      }))
    return {
      rows,
      totals: {
        consultants: data.length,
        roles: data.reduce((s, c) => s + c.total_jobs, 0),
        candidates: data.reduce((s, c) => s + c.total_candidates, 0),
        submitted: totalSubmitted,
      },
    }
  }, [data])

  return (
    <Panel title="Consultant breakdown" className="lg:col-span-2">
      {isLoading ? (
        <div className="min-h-55 divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 max-w-45 flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="No consultants yet." />
      ) : (
        <>
          {/* Summary strip */}
          <div className="mb-3 grid grid-cols-4 gap-4 border-b pb-3">
            <Stat label="Consultants" value={totals.consultants} />
            <Stat label="Roles" value={totals.roles} />
            <Stat label="Candidates" value={totals.candidates} />
            <Stat label="Submitted" value={totals.submitted} />
          </div>

          <ul className="divide-y">
            {rows.map((c, i) => (
              <li key={c.consultant_id} className="py-3">
                <button
                  onClick={() => toggle(c.consultant_id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  {open[c.consultant_id] ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      {i === 0 && c.submitted > 0 && (
                        <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                          Top
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.share}% of submissions
                      {c.total_jobs > 0 && ` · ${c.avgPerRole.toFixed(1)} avg / role`}
                    </div>
                    {/* Submissions relative to the top performer */}
                    <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${c.barPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Badge variant="secondary">{c.total_jobs} roles</Badge>
                    <Badge variant="secondary">{c.total_candidates} candidates</Badge>
                    <Badge variant="default">{c.submitted} submitted</Badge>
                  </div>
                </button>

                {open[c.consultant_id] && (
                  <ul className="mt-2 space-y-1 pl-6">
                    {c.jobs.length === 0 ? (
                      <li className="text-sm text-muted-foreground">No roles assigned.</li>
                    ) : (
                      c.jobs.map((j) => (
                        <li
                          key={j.job_id}
                          onClick={() => navigate(`/candidates?job=${j.job_id}`)}
                          className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted/40"
                        >
                          <span>{j.title}</span>
                          <Badge variant="secondary">{j.candidate_count} profiles</Badge>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
