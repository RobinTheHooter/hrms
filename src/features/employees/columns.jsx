import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  labelOf,
} from '@/features/employees/constants'

const statusClass = {
  active: 'bg-green-100 text-green-800',
  probation: 'bg-amber-100 text-amber-800',
  on_leave: 'bg-blue-100 text-blue-800',
  terminated: 'bg-red-100 text-red-800',
}

/**
 * @param {{ onEdit: (row:any)=>void, onDelete: (row:any)=>void }} handlers
 */
export function getEmployeeColumns({ onEdit, onDelete }) {
  return [
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
          Name
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'job_title', header: 'Job title' },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'employment_type',
      header: 'Type',
      cell: ({ getValue }) => labelOf(EMPLOYMENT_TYPES, getValue()),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              statusClass[value] ?? 'bg-secondary'
            }`}
          >
            {labelOf(EMPLOYEE_STATUSES, value)}
          </span>
        )
      },
    },
    {
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
    },
  ]
}
