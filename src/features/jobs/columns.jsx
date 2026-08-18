import { Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { jobStatusVariant } from '@/features/jobs/constants'
import { optionLabel } from '@/features/meta/hooks'

export function getJobColumns({ onEdit, onDelete, canManage, options }) {
  const columns = [
    {
      accessorKey: 'title',
      header: 'Role',
      cell: ({ row }) => {
        const j = row.original
        return (
          <div className="leading-tight">
            <div className="font-medium">{j.title}</div>
            <div className="text-xs text-muted-foreground">
              {[j.department, j.location].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'employment_type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant="secondary">
          {optionLabel(options?.employment_types, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'positions',
      header: 'Openings',
      cell: ({ getValue }) => getValue(),
    },
    {
      id: 'consultant',
      header: 'Consultant',
      cell: ({ row }) => row.original.assigned_consultant?.full_name ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={jobStatusVariant(getValue())}>
          {optionLabel(options?.job_statuses, getValue())}
        </Badge>
      ),
    },
  ]

  if (canManage) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    })
  }

  return columns
}
