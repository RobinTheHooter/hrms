import { Pencil, Trash2 } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { roleBadgeVariant } from '@/features/users/constants'
import { optionLabel } from '@/features/meta/hooks'

export function getUserColumns({ onEdit, onDelete, currentUserId, options }) {
  return [
    {
      accessorKey: 'full_name',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar name={u.full_name} />
            <div className="leading-tight">
              <div className="font-medium">
                {u.full_name}
                {u.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <Badge variant={roleBadgeVariant[getValue()] ?? 'secondary'}>
          {optionLabel(options?.user_roles, getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row.original)}
              disabled={isSelf}
              title={isSelf ? "You can't delete your own account" : 'Delete'}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]
}
