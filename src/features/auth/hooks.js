import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getCurrentUser, login } from '@/features/auth/api'
import { DEV_AUTH_ENABLED, DEV_USER } from '@/features/auth/devUser'
import { useAuthStore } from '@/features/auth/store'

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.access_token)
      // Drop any previously cached user so we refetch for the new token.
      qc.removeQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['auth', 'me'],
    // DEV: return the hard-coded user instead of hitting the backend.
    queryFn: DEV_AUTH_ENABLED ? async () => DEV_USER : getCurrentUser,
    enabled: Boolean(token),
  })
}
