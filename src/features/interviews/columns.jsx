import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'

import { ActionsRenderer } from '@/components/GlobalComponents/TableComponents/ActionsRenderer'
import { BadgeRenderer } from '@/components/GlobalComponents/TableComponents/BadgeRenderer'
import { MeetingRenderer } from '@/components/GlobalComponents/TableComponents/MeetingRenderer'
import { PersonRenderer } from '@/components/GlobalComponents/TableComponents/PersonRenderer'
import {
  formatWhen,
  outcomeVariant,
  statusVariant,
} from '@/features/interviews/constants'
import { optionLabel } from '@/features/meta/hooks'
import { priorityVariant } from '@/lib/priority'

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
      headerName: 'Candidate',
      colId: 'candidate',
      flex: 2,
      minWidth: 200,
      cellRenderer: PersonRenderer,
      cellRendererParams: {
        avatar: false,
        getName: (d) => d.candidate?.full_name ?? '—',
        getSubtitle: (d) => d.candidate?.job?.title ?? '—',
      },
      valueGetter: (p) =>
        `${p.data.candidate?.full_name ?? ''} ${p.data.candidate?.job?.title ?? ''}`,
    },
    {
      headerName: 'Hiring manager',
      colId: 'manager',
      valueGetter: (p) => p.data.hiring_manager?.full_name ?? 'Unassigned',
    },
    {
      headerName: 'Mode',
      colId: 'mode',
      maxWidth: 130,
      valueGetter: (p) => optionLabel(options?.interview_modes, p.data.mode),
      cellRenderer: BadgeRenderer,
    },
    {
      headerName: 'When',
      field: 'scheduled_at',
      minWidth: 180,
      valueFormatter: (p) => formatWhen(p.value),
    },
    {
      headerName: 'Status',
      colId: 'status',
      valueGetter: (p) => optionLabel(options?.interview_statuses, p.data.status),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => statusVariant(d.status) },
    },
    {
      headerName: 'Outcome',
      colId: 'outcome',
      valueGetter: (p) => optionLabel(options?.interview_outcomes, p.data.outcome),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => outcomeVariant(d.outcome) },
    },
    {
      headerName: 'Priority',
      colId: 'priority',
      valueGetter: (p) => optionLabel(options?.priorities, p.data.priority),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => priorityVariant(d.priority) },
    },
    {
      headerName: 'Meeting',
      colId: 'meeting',
      maxWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: MeetingRenderer,
    },
  ]

  if (canSchedule || canConduct) {
    columns.push({
      headerName: '',
      colId: 'actions',
      flex: 0,
      width: 140,
      minWidth: 140,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsRenderer,
      cellRendererParams: {
        getActions: (d) => [
          {
            icon: CheckCircle2,
            title: 'Record outcome',
            onClick: onOutcome,
            className: 'text-emerald-600',
            hidden: !(canConduct && d.status !== 'completed'),
          },
          { icon: Pencil, title: 'Reschedule', onClick: onEdit, hidden: !canSchedule },
          {
            icon: Trash2,
            title: 'Delete',
            danger: true,
            onClick: onDelete,
            hidden: !canSchedule,
          },
        ],
      },
    })
  }

  return columns
}
