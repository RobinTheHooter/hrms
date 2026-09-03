import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from '@/features/employees/api'

const EMPLOYEES_KEY = ['employees']

function invalidateEmployeeViews(qc) {
  qc.invalidateQueries({ queryKey: ['employees'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useEmployees(params) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, params],
    queryFn: () => listEmployees(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => invalidateEmployeeViews(qc),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateEmployee(id, payload),
    onSuccess: () => invalidateEmployeeViews(qc),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => invalidateEmployeeViews(qc),
  })
}
