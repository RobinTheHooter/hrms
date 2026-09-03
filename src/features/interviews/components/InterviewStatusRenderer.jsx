import { ChevronRight, FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { optionLabel } from '@/features/meta/hooks'
import { relativeWhen, statusVariant } from '@/features/interviews/constants'

export function InterviewStatusRenderer(params) {
  const { data, options, onStatusClick } = params
  const status = data.status
  const label = optionLabel(options?.interview_statuses, status) || status

  // The "result" line: for completed, the decision; for scheduled, when.
  let result = null
  if (status === 'scheduled') {
    result = relativeWhen(data.scheduled_at)
  } else if (status === 'completed') {
    result =
      data.outcome === 'selected'
        ? 'Selected'
        : data.outcome === 'rejected'
          ? 'Rejected'
          : 'Awaiting decision'
  }

  return (
    <button
      type="button"
      onClick={() => onStatusClick?.(data)}
      title="View interview details"
      className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-muted/60"
    >
      <Badge variant={statusVariant(status)}>{label}</Badge>
      {result && <span className="text-xs text-muted-foreground">· {result}</span>}
      {data.feedback && (
        <FileText className="size-3 text-muted-foreground" aria-label="Scorecard added" />
      )}
      <ChevronRight className="size-3 text-muted-foreground/60" />
    </button>
  )
}

export default InterviewStatusRenderer
