import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createJob,
  deleteJob,
  getJob,
  listConsultants,
  listJobs,
  updateJob,
} from '@/features/jobs/api'

const JOBS_KEY = ['jobs']

export function useJobs(params) {
  return useQuery({
    queryKey: [...JOBS_KEY, params],
    queryFn: () => listJobs(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

export function useJob(id) {
  return useQuery({
    queryKey: [...JOBS_KEY, 'detail', id],
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  })
}

export function useConsultants() {
  return useQuery({ queryKey: ['consultants'], queryFn: listConsultants })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  })
}
