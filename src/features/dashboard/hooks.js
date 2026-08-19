import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'

async function getSummary(days) {
  const { data } = await apiClient.get('/dashboard/summary', { params: { days } })
  return data
}

export function useDashboardSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'summary', days],
    queryFn: () => getSummary(days),
    placeholderData: keepPreviousData,
  })
}
