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
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateEmployee(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}
