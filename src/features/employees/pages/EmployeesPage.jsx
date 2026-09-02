import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Table } from '@/components/GlobalComponents/Table/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
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
import { errorMessage } from '@/lib/api-error'

export function EmployeesPage() {
  const [dialog, setDialog] = useState({ open: false, mode: 'create', employee: null })

  // Load the full set; the grid handles search, sort and pagination client-side.
  const { data, isLoading, isError } = useEmployees({ page: 1, size: 1000 })

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
    <div>
      <PageHeader
        title="Employees"
        breadcrumb={['HR', 'Employees']}
        actions={
          canWrite && (
            <Button onClick={openCreate} size="sm">
              <Plus className="size-4" />
              Add employee
            </Button>
          )
        }
      />

      {isError ? (
        <p className="p-6 text-sm text-destructive">
          Couldn't load employees. Is the backend running?
        </p>
      ) : (
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          searchPlaceholder="Search by name, email, or title…"
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
