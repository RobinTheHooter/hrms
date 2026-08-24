import { Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Table } from '@/components/GlobalComponents/Table/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/hooks'
import { useOptions } from '@/features/meta/hooks'
import { getUserColumns } from '@/features/users/columns'
import { UserFormDialog } from '@/features/users/components/UserFormDialog'
import {
  useBulkDeleteUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks'

import { useConfirm } from '@/components/ui/confirm-dialog'
import { errorMessage } from '@/lib/api-error'

export function UsersPage() {
  const { data: currentUser } = useCurrentUser()
  const { data: options } = useOptions()
  const confirm = useConfirm()
  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null })

  const { data, isLoading, isError } = useUsers({ page: 1, size: 1000 })

  const createMut = useCreateUser()
  const updateMut = useUpdateUser()
  const deleteMut = useDeleteUser()
  const bulkDeleteMut = useBulkDeleteUsers()

  const [selected, setSelected] = useState([])
  const gridApi = useRef(null)
  const clearSelection = () => {
    gridApi.current?.deselectAll()
    setSelected([])
  }

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selected.length} user${selected.length > 1 ? 's' : ''}?`,
      description: 'This permanently removes the selected accounts.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    bulkDeleteMut.mutate(
      selected.map((u) => u.id),
      {
        onSuccess: (res) => {
          toast.success(`Deleted ${res?.deleted ?? selected.length} user(s)`)
          clearSelection()
        },
        onError: (e) => toast.error(errorMessage(e, 'Failed to delete users')),
      },
    )
  }

  const openCreate = () => setDialog({ open: true, mode: 'create', user: null })
  const openEdit = (user) => setDialog({ open: true, mode: 'edit', user })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const handleDelete = async (user) => {
    const ok = await confirm({
      title: 'Delete user?',
      description: `This permanently removes ${user.full_name}'s account.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
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
          selectable
          onSelectionChanged={setSelected}
          onGridReady={(p) => (gridApi.current = p.api)}
          selection={{
            count: selected.length,
            onDelete: handleBulkDelete,
            onClear: clearSelection,
            isDeleting: bulkDeleteMut.isPending,
          }}
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
