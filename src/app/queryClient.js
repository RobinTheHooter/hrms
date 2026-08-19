import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Auto-refresh when the user returns to the tab or reconnects.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})
