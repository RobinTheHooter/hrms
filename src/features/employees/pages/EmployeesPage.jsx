import { DataTable } from '@/components/ui/data-table'
import { employeeColumns } from '@/features/employees/columns'
import { useEmployees } from '@/features/employees/hooks'

export function EmployeesPage() {
  const { data, isLoading } = useEmployees()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization's people.
        </p>
      </div>

      <DataTable
        columns={employeeColumns}
        data={data ?? []}
        isLoading={isLoading}
      />
    </div>
  )
}
