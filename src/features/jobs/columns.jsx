import { Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EMPLOYMENT_TYPES, JOB_STATUSES, labelOf } from '@/features/jobs/constants'

export function getJobColumns({ onEdit, onDelete, canManage }) {
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
        <Badge variant="secondary">{labelOf(EMPLOYMENT_TYPES, getValue())}</Badge>
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
        <Badge variant={getValue() === 'open' ? 'success' : 'secondary'}>
          {labelOf(JOB_STATUSES, getValue())}
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
