import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'

async function getOptions() {
  const { data } = await apiClient.get('/meta/options')
  return data // { employment_types, job_statuses, candidate_sources, candidate_stages, user_roles }
}

/**
 * All selectable dropdown options, served by the backend (single source of
 * truth). Cached for the session.
 */
export function useOptions() {
  return useQuery({
    queryKey: ['meta', 'options'],
    queryFn: getOptions,
    staleTime: Infinity,
  })
}

/** Resolve a value to its label within an options list. */
export function optionLabel(list, value) {
  return (list ?? []).find((o) => o.value === value)?.label ?? value ?? ''
}
