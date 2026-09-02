import { useQuery } from '@tanstack/react-query'

import { HttpClient } from '@/lib/httpClient'

async function getOptions() {
  return HttpClient('/meta/options')
}

/* All selectable dropdown options, served by the backend (single source of truth). Cached for the session. */
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
