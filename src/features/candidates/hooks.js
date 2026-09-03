import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  bulkDeleteCandidates,
  bulkUploadCandidates,
  createCandidate,
  deleteCandidate,
  getCandidate,
  getEmailTemplates,
  listCandidates,
  notifyCandidate,
  scoreCandidate,
  updateCandidate,
  uploadResume,
} from '@/features/candidates/api'

const KEY = ['candidates']

function invalidateCandidateViews(qc) {
  qc.invalidateQueries({ queryKey: ['candidates'] })
  qc.invalidateQueries({ queryKey: ['jobs'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
  qc.invalidateQueries({ queryKey: ['notifications'] })
}

export function useBulkUploadCandidates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, files, sendAck }) =>
      bulkUploadCandidates(jobId, files, sendAck),
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useCandidate(id) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => getCandidate(id),
    enabled: Boolean(id),
  })
}

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }) => uploadResume(id, file),
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useScoreCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => scoreCandidate(id),
    onSuccess: () => invalidateCandidateViews(qc),
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => notifyCandidate(id, payload),
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useCandidates(params) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => listCandidates(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

export function useCreateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useUpdateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateCandidate(id, payload),
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useDeleteCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => invalidateCandidateViews(qc),
  })
}

export function useBulkDeleteCandidates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bulkDeleteCandidates,
    onSuccess: () => invalidateCandidateViews(qc),
  })
}
