import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/features/auth/hooks'
import { getUserColumns } from '@/features/users/columns'
import { UserFormDialog } from '@/features/users/components/UserFormDialog'
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks'

const errorMessage = (error, fallback) =>
  error?.response?.data?.detail ??
  (error?.response?.status === 403 ? "You don't have permission." : fallback)

export function UsersPage() {
  const { data: currentUser } = useCurrentUser()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null })

  const { data, isLoading, isError } = useUsers({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    search,
  })

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
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id],
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

      <Card>
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-9"
            />
          </div>
        </div>

        {isError ? (
          <p className="p-6 text-sm text-destructive">
            Couldn't load users. Is the backend running?
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            manualPagination
            pageCount={data?.pages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )}
      </Card>

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
