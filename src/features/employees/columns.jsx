import { Pencil, Trash2 } from 'lucide-react'

import { ActionsRenderer } from '@/components/GlobalComponents/TableComponents/ActionsRenderer'
import { BadgeRenderer } from '@/components/GlobalComponents/TableComponents/BadgeRenderer'
import { PersonRenderer } from '@/components/GlobalComponents/TableComponents/PersonRenderer'
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
      headerName: 'Employee',
      field: 'first_name',
      flex: 2,
      minWidth: 220,
      cellRenderer: PersonRenderer,
      cellRendererParams: {
        getName: (d) => `${d.first_name} ${d.last_name}`,
        getSubtitle: (d) => d.email,
      },
      // Drives quick-filter search and sorting on the full name + email.
      valueGetter: (p) =>
        `${p.data.first_name ?? ''} ${p.data.last_name ?? ''} ${p.data.email ?? ''}`,
    },
    { headerName: 'Job title', field: 'job_title', flex: 1, minWidth: 150 },
    {
      headerName: 'Department',
      colId: 'department',
      valueGetter: (p) => p.data.department || '—',
    },
    {
      headerName: 'Type',
      field: 'employment_type',
      cellRenderer: BadgeRenderer,
      cellRendererParams: {
        getVariant: () => 'secondary',
        getLabel: (v) => labelOf(EMPLOYMENT_TYPES, v),
      },
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: BadgeRenderer,
      cellRendererParams: {
        getVariant: (v) => statusVariant[v] ?? 'secondary',
        getLabel: (v) => labelOf(EMPLOYEE_STATUSES, v),
      },
    },
  ]

  if (canWrite) {
    columns.push({
      headerName: 'Actions',
      colId: 'actions',
      headerClass: 'header-center',
      flex: 0,
      width: 110,
      minWidth: 110,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsRenderer,
      cellRendererParams: {
        getActions: () => [
          { icon: Pencil, title: 'Edit', onClick: onEdit },
          { icon: Trash2, title: 'Delete', danger: true, onClick: onDelete },
        ],
      },
    })
  }

  return columns
}
