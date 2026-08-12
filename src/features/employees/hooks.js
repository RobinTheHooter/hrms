import { useQuery } from '@tanstack/react-query'

import { listEmployees } from '@/features/employees/api'

export function useEmployees(params) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => listEmployees(params),
  })
}
