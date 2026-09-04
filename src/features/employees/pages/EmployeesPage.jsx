import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Pagination } from '@/components/GlobalComponents/Table/Pagination'
import { Table } from '@/components/GlobalComponents/Table/Table'
import { ErrorState } from '@/components/ui/error-state'
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

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading, isFetching, isError, refetch } = useEmployees({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
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
        <ErrorState
          description="We couldn't load your employees right now. Please try again in a moment."
          onRetry={refetch}
        />
      ) : (
        <Table
          rowData={data?.items ?? []}
          columnData={columns}
          isLoading={isLoading}
          useAgGridPagination={false}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or title…"
          footer={
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data?.total ?? 0}
              pages={data?.pages ?? 0}
              isFetching={isFetching}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n)
                setPage(1)
              }}
            />
          }
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
