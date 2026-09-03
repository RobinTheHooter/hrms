import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { disconnectGoogle, getGoogleStatus } from '@/features/integrations/api'

export function useGoogleStatus() {
  return useQuery({ queryKey: ['google-status'], queryFn: getGoogleStatus })
}

export function useDisconnectGoogle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['google-status'] }),
  })
}
