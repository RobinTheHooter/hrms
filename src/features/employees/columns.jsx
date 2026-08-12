import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  labelOf,
} from '@/features/employees/constants'

const statusVariant = {
  active: 'success',
  probation: 'warning',
  on_leave: 'info',
  terminated: 'destructive',
}

/**
 * @param {{ onEdit: (row:any)=>void, onDelete: (row:any)=>void, canWrite?: boolean }} opts
 */
export function getEmployeeColumns({ onEdit, onDelete, canWrite = false }) {
  const columns = [
    {
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      id: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Employee
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const e = row.original
        const name = `${e.first_name} ${e.last_name}`
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <div className="leading-tight">
              <div className="font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{e.email}</div>
            </div>
          </div>
        )
      },
    },
    { accessorKey: 'job_title', header: 'Job title' },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'employment_type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant="secondary">
          {labelOf(EMPLOYMENT_TYPES, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <Badge variant={statusVariant[value] ?? 'secondary'}>
            {labelOf(EMPLOYEE_STATUSES, value)}
          </Badge>
        )
      },
    },
  ]

  if (canWrite) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    })
  }

  return columns
}
