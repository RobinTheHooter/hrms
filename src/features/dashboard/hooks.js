import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'

async function getSummary() {
  const { data } = await apiClient.get('/dashboard/summary')
  return data
}

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getSummary })
}
