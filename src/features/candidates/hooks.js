import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createCandidate,
  deleteCandidate,
  listCandidates,
  updateCandidate,
} from '@/features/candidates/api'

const KEY = ['candidates']

export function useCandidates(params) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => listCandidates(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateCandidate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
