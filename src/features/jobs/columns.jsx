import { Ban, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import { ActionsRenderer } from '@/components/GlobalComponents/TableComponents/ActionsRenderer'
import { BadgeRenderer } from '@/components/GlobalComponents/TableComponents/BadgeRenderer'
import { PersonRenderer } from '@/components/GlobalComponents/TableComponents/PersonRenderer'
import { jobStatusVariant } from '@/features/jobs/constants'
import { optionLabel } from '@/features/meta/hooks'
import { priorityVariant } from '@/lib/priority'

// Ag-Grid column defs for the Jobs table. Headers live here in the frontend;
// custom cells are composed from the shared TableComponents renderers.
export function getJobColumns({ onEdit, onDelete, onToggleStatus, canManage, options }) {
  const columns = [
    {
      headerName: 'Role',
      field: 'title',
      flex: 2,
      minWidth: 200,
      cellRenderer: PersonRenderer,
      cellRendererParams: {
        avatar: false,
        getName: (d) => d.title,
        getSubtitle: (d) =>
          [d.department, d.location].filter(Boolean).join(' · ') || '—',
        getHref: (d) => `/jobs/${d.id}`,
      },
      valueGetter: (p) =>
        [p.data.title, p.data.department, p.data.location]
          .filter(Boolean)
          .join(' '),
    },
    {
      headerName: 'Type',
      colId: 'employment_type',
      valueGetter: (p) => optionLabel(options?.employment_types, p.data.employment_type),
      cellRenderer: BadgeRenderer,
    },
    {
      headerName: 'Openings',
      field: 'positions',
      maxWidth: 130,
    },
    {
      headerName: 'Consultant',
      colId: 'consultant',
      valueGetter: (p) => p.data.assigned_consultant?.full_name ?? '—',
    },
    {
      headerName: 'Status',
      colId: 'status',
      valueGetter: (p) => optionLabel(options?.job_statuses, p.data.status),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => jobStatusVariant(d.status) },
    },
    {
      headerName: 'Priority',
      colId: 'priority',
      valueGetter: (p) => optionLabel(options?.priorities, p.data.priority),
      cellRenderer: BadgeRenderer,
      cellRendererParams: { getVariant: (_v, d) => priorityVariant(d.priority) },
    },
  ]

  if (canManage) {
    columns.push({
      headerName: 'Actions',
      colId: 'actions',
      headerClass: 'header-center',
      flex: 0,
      width: 150,
      minWidth: 150,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsRenderer,
      cellRendererParams: {
        getActions: (d) => [
          {
            icon: d.status === 'open' ? Ban : RotateCcw,
            title: d.status === 'open' ? 'Close job' : 'Reopen job',
            onClick: onToggleStatus,
          },
          { icon: Pencil, title: 'Edit', onClick: onEdit },
          { icon: Trash2, title: 'Delete', danger: true, onClick: onDelete },
        ],
      },
    })
  }

  return columns
}
