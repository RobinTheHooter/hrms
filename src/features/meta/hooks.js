import { useQuery } from '@tanstack/react-query'

import { HttpClient } from '@/lib/httpClient'

async function getOptions(signal) {
  return HttpClient('/meta/options', {}, signal)
}

/* All selectable dropdown options, served by the backend (single source of truth). Cached for the session. */
export function useOptions() {
  return useQuery({
    queryKey: ['meta', 'options'],
    queryFn: ({ signal }) => getOptions(signal),
    staleTime: Infinity,
  })
}

/** Resolve a value to its label within an options list. */
export function optionLabel(list, value) {
  return (list ?? []).find((o) => o.value === value)?.label ?? value ?? ''
}
