import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  bulkDeleteJobs,
  createJob,
  deleteJob,
  generateJobDescription,
  getJob,
  listConsultants,
  listJobs,
  updateJob,
} from '@/features/jobs/api'

const JOBS_KEY = ['jobs']

function invalidateJobViews(qc) {
  qc.invalidateQueries({ queryKey: ['jobs'] })
  qc.invalidateQueries({ queryKey: ['candidates'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useJobs(params) {
  return useQuery({
    queryKey: [...JOBS_KEY, params],
    queryFn: ({ signal }) => listJobs(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useJob(id) {
  return useQuery({
    queryKey: [...JOBS_KEY, 'detail', id],
    queryFn: ({ signal }) => getJob(id, signal),
    enabled: Boolean(id),
  })
}

export function useConsultants() {
  return useQuery({
    queryKey: ['consultants'],
    queryFn: ({ signal }) => listConsultants(signal),
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => invalidateJobViews(qc),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: () => invalidateJobViews(qc),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => invalidateJobViews(qc),
  })
}

export function useGenerateJobDescription() {
  return useMutation({ mutationFn: generateJobDescription })
}

export function useBulkDeleteJobs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bulkDeleteJobs,
    onSuccess: () => invalidateJobViews(qc),
  })
}
