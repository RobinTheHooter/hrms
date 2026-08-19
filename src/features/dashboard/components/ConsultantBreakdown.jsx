import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Panel } from '@/components/ui/panel'
import { LoadingBlock } from '@/components/ui/spinner'
import { useConsultantBreakdown } from '@/features/dashboard/hooks'

export function ConsultantBreakdown() {
  const navigate = useNavigate()
  const { data = [], isLoading } = useConsultantBreakdown(true)
  const [open, setOpen] = useState({})
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <Panel title="Consultant breakdown" className="lg:col-span-2">
      {isLoading ? (
        <LoadingBlock className="min-h-[220px] py-0" />
      ) : data.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No consultants yet.</p>
      ) : (
        <ul className="divide-y">
          {data.map((c) => (
            <li key={c.consultant_id} className="py-2.5">
              <button
                onClick={() => toggle(c.consultant_id)}
                className="flex w-full items-center gap-2 text-left"
              >
                {open[c.consultant_id] ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="flex-1 font-medium">{c.name}</span>
                <Badge variant="secondary">{c.total_jobs} roles</Badge>
                <Badge variant="secondary">{c.total_candidates} candidates</Badge>
                <Badge variant="default">{c.submitted} submitted</Badge>
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
      )}
    </Panel>
  )
}
