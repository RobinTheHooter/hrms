import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Table } from '@/components/GlobalComponents/Table/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/hooks'
import { useOptions } from '@/features/meta/hooks'
import { getUserColumns } from '@/features/users/columns'
import { UserFormDialog } from '@/features/users/components/UserFormDialog'
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks'

import { errorMessage } from '@/lib/api-error'

export function UsersPage() {
  const { data: currentUser } = useCurrentUser()
  const { data: options } = useOptions()
  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null })

  const { data, isLoading, isError } = useUsers({ page: 1, size: 1000 })

  const createMut = useCreateUser()
  const updateMut = useUpdateUser()
  const deleteMut = useDeleteUser()

  const openCreate = () => setDialog({ open: true, mode: 'create', user: null })
  const openEdit = (user) => setDialog({ open: true, mode: 'edit', user })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const handleDelete = (user) => {
    if (!window.confirm(`Delete ${user.full_name}?`)) return
    deleteMut.mutate(user.id, {
      onSuccess: () => toast.success('User deleted'),
      onError: (e) => toast.error(errorMessage(e, 'Failed to delete user')),
    })
  }

  const handleSubmit = (payload) => {
    if (dialog.mode === 'edit') {
      updateMut.mutate(
        { id: dialog.user.id, payload },
        {
          onSuccess: () => {
            toast.success('User updated')
            closeDialog()
          },
          onError: (e) => toast.error(errorMessage(e, 'Failed to update user')),
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('User created')
          closeDialog()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to create user')),
      })
    }
  }

  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        currentUserId: currentUser?.id,
        options,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, options],
  )

  const editInitial =
    dialog.mode === 'edit' && dialog.user
      ? {
          full_name: dialog.user.full_name,
          email: dialog.user.email,
          password: '',
          role: dialog.user.role,
          is_active: dialog.user.is_active ? 'true' : 'false',
        }
      : undefined

  return (
    <div>
      <PageHeader
        title="User Management"
        breadcrumb={['System', 'Users']}
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" /> Add user
          </Button>
        }
      />

      {isError ? (
        <p className="p-6 text-sm text-destructive">
          Couldn't load users. Is the backend running?
        </p>
      ) : (
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          searchPlaceholder="Search by name or email…"
        />
      )}

      <UserFormDialog
        open={dialog.open}
        onOpenChange={(open) => (open ? null : closeDialog())}
        mode={dialog.mode}
        initialValues={editInitial}
        onSubmit={handleSubmit}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />
    </div>
  )
}
