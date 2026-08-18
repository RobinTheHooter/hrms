import { CalendarClock, CheckCircle2, Pencil, Trash2, Video } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatWhen,
  outcomeVariant,
  statusVariant,
} from '@/features/interviews/constants'
import { optionLabel } from '@/features/meta/hooks'

export function getInterviewColumns({
  onEdit,
  onOutcome,
  onDelete,
  canSchedule,
  canConduct,
  options,
}) {
  const columns = [
    {
      id: 'candidate',
      header: 'Candidate',
      cell: ({ row }) => {
        const c = row.original.candidate
        return (
          <div className="leading-tight">
            <div className="font-medium">{c?.full_name ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              {c?.job?.title ?? '—'}
            </div>
          </div>
        )
      },
    },
    {
      id: 'manager',
      header: 'Hiring manager',
      cell: ({ row }) => row.original.hiring_manager?.full_name ?? 'Unassigned',
    },
    {
      accessorKey: 'mode',
      header: 'Mode',
      cell: ({ getValue }) => (
        <Badge variant="secondary">
          {optionLabel(options?.interview_modes, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'scheduled_at',
      header: 'When',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <CalendarClock className="size-3.5 text-muted-foreground" />
          {formatWhen(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={statusVariant(getValue())}>
          {optionLabel(options?.interview_statuses, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'outcome',
      header: 'Outcome',
      cell: ({ getValue }) => (
        <Badge variant={outcomeVariant(getValue())}>
          {optionLabel(options?.interview_outcomes, getValue())}
        </Badge>
      ),
    },
    {
      id: 'meeting',
      header: 'Meeting',
      cell: ({ row }) =>
        row.original.meeting_link ? (
          <a
            href={row.original.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Video className="size-3.5" /> Join
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  if (canSchedule || canConduct) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canConduct && row.original.status !== 'completed' && (
            <Button
              variant="ghost"
              size="icon"
              title="Record outcome"
              onClick={() => onOutcome(row.original)}
            >
              <CheckCircle2 className="size-4 text-emerald-600" />
            </Button>
          )}
          {canSchedule && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Reschedule"
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    })
  }

  return columns
}
