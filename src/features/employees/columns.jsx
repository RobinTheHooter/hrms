import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Column definitions for the employees DataTable. */
export const employeeColumns = [
  {
    accessorKey: 'full_name',
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
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => (
      <span className="capitalize rounded-full bg-secondary px-2 py-0.5 text-xs">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ getValue }) => (getValue() ? 'Active' : 'Inactive'),
  },
]
