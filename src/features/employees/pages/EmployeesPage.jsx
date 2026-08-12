import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/features/auth/hooks'
import { canManageEmployees } from '@/features/auth/permissions'
import { getEmployeeColumns } from '@/features/employees/columns'
import { EmployeeFormDialog } from '@/features/employees/components/EmployeeFormDialog'
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '@/features/employees/hooks'
import { toFormValues } from '@/features/employees/schema'

const errorMessage = (error, fallback) =>
  error?.response?.status === 403
    ? "You don't have permission to do that."
    : fallback

export function EmployeesPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState({ open: false, mode: 'create', employee: null })

  const { data, isLoading, isError } = useEmployees({
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    search,
  })

  const { data: currentUser } = useCurrentUser()
  const canWrite = canManageEmployees(currentUser?.role)

  const createMut = useCreateEmployee()
  const updateMut = useUpdateEmployee()
  const deleteMut = useDeleteEmployee()

  const openCreate = () =>
    setDialog({ open: true, mode: 'create', employee: null })
  const openEdit = (employee) =>
    setDialog({ open: true, mode: 'edit', employee })
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const handleDelete = (employee) => {
    if (!window.confirm(`Delete ${employee.first_name} ${employee.last_name}?`))
      return
    deleteMut.mutate(employee.id, {
      onSuccess: () => toast.success('Employee deleted'),
      onError: (e) =>
        toast.error(errorMessage(e, 'Failed to delete employee')),
    })
  }

  const handleSubmit = (payload) => {
    if (dialog.mode === 'edit') {
      updateMut.mutate(
        { id: dialog.employee.id, payload },
        {
          onSuccess: () => {
            toast.success('Employee updated')
            closeDialog()
          },
          onError: (e) =>
            toast.error(errorMessage(e, 'Failed to update employee')),
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Employee created')
          closeDialog()
        },
        onError: (e) =>
          toast.error(errorMessage(e, 'Failed to create employee')),
      })
    }
  }

  const columns = useMemo(
    () => getEmployeeColumns({ onEdit: openEdit, onDelete: handleDelete, canWrite }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canWrite],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} total
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add employee
          </Button>
        )}
      </div>

      <Input
        placeholder="Search by name, email, or title…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPagination((p) => ({ ...p, pageIndex: 0 }))
        }}
        className="max-w-sm"
      />

      {isError ? (
        <p className="text-sm text-destructive">
          Couldn't load employees. Is the backend running?
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

      <EmployeeFormDialog
        open={dialog.open}
        onOpenChange={(open) => (open ? null : closeDialog())}
        mode={dialog.mode}
        initialValues={
          dialog.mode === 'edit' && dialog.employee
            ? toFormValues(dialog.employee)
            : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />
    </div>
  )
}
