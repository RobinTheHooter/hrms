import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createCandidate,
  deleteCandidate,
  getEmailTemplates,
  listCandidates,
  notifyCandidate,
  scoreCandidate,
  updateCandidate,
  uploadResume,
} from '@/features/candidates/api'

const KEY = ['candidates']

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }) => uploadResume(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useScoreCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => scoreCandidate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEmailTemplates(candidateId, enabled) {
  return useQuery({
    queryKey: ['candidate-email-templates', candidateId],
    queryFn: () => getEmailTemplates(candidateId),
    enabled: Boolean(candidateId && enabled),
  })
}

export function useNotifyCandidate() {
  return useMutation({
    mutationFn: ({ id, payload }) => notifyCandidate(id, payload),
  })
}

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
