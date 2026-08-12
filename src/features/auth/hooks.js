import { useMutation, useQuery } from '@tanstack/react-query'

import { getCurrentUser, login } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken)
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setToken(data.access_token),
  })
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
  })
}
