import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  bulkDeleteInterviews,
  deleteInterview,
  getAvailability,
  listHiringManagers,
  listInterviews,
  recordOutcome,
  saveFeedback,
  scheduleInterview,
  updateInterview,
} from '@/features/interviews/api'

const KEY = ['interviews']

export function useAvailability(managerId, date) {
  return useQuery({
    queryKey: ['availability', managerId, date],
    queryFn: ({ signal }) => getAvailability(managerId, date, signal),
    enabled: Boolean(managerId && date),
  })
}

export function useInterviews(params) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: ({ signal }) => listInterviews(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useHiringManagers() {
  return useQuery({
    queryKey: ['hiring-managers'],
    queryFn: ({ signal }) => listHiringManagers(signal),
  })
}

function useInterviewMutation(mutationFn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useScheduleInterview() {
  return useInterviewMutation(scheduleInterview)
}

export function useUpdateInterview() {
  return useInterviewMutation(({ id, payload }) => updateInterview(id, payload))
}

export function useRecordOutcome() {
  return useInterviewMutation(({ id, payload }) => recordOutcome(id, payload))
}

export function useSaveFeedback() {
  return useInterviewMutation(({ id, payload }) => saveFeedback(id, payload))
}

export function useDeleteInterview() {
  return useInterviewMutation(deleteInterview)
}

export function useBulkDeleteInterviews() {
  return useInterviewMutation(bulkDeleteInterviews)
}
