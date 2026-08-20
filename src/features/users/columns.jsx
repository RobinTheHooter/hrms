import { Pencil, Trash2 } from 'lucide-react'

import { ActionsRenderer } from '@/components/GlobalComponents/TableComponents/ActionsRenderer'
import { BadgeRenderer } from '@/components/GlobalComponents/TableComponents/BadgeRenderer'
import { PersonRenderer } from '@/components/GlobalComponents/TableComponents/PersonRenderer'
import { optionLabel } from '@/features/meta/hooks'
import { roleBadgeVariant } from '@/features/users/constants'

export function getUserColumns({ onEdit, onDelete, currentUserId, options }) {
  return [
    {
      headerName: 'User',
      field: 'full_name',
      flex: 2,
      minWidth: 220,
      cellRenderer: PersonRenderer,
      cellRendererParams: {
        getName: (d) => d.full_name,
        getSubtitle: (d) => d.email,
        getSuffix: (d) => (d.id === currentUserId ? '(you)' : null),
      },
      valueGetter: (p) => `${p.data.full_name ?? ''} ${p.data.email ?? ''}`,
    },
    {
      headerName: 'Role',
      colId: 'role',
      valueGetter: (p) => optionLabel(options?.user_roles, p.data.role),
      cellRenderer: BadgeRenderer,
      cellRendererParams: {
        getVariant: (_v, d) => roleBadgeVariant[d.role] ?? 'secondary',
      },
    },
    {
      headerName: 'Status',
      colId: 'is_active',
      maxWidth: 140,
      valueGetter: (p) => (p.data.is_active ? 'Active' : 'Inactive'),
      cellRenderer: BadgeRenderer,
      cellRendererParams: {
        getVariant: (v) => (v === 'Active' ? 'success' : 'secondary'),
      },
    },
    {
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
        getActions: (d) => [
          { icon: Pencil, title: 'Edit', onClick: onEdit },
          {
            icon: Trash2,
            title: d.id === currentUserId ? "You can't delete your own account" : 'Delete',
            danger: true,
            onClick: onDelete,
            disabled: d.id === currentUserId,
          },
        ],
      },
    },
  ]
}
