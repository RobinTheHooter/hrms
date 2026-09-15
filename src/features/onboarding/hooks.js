import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  addOnboardingTask,
  convertOnboarding,
  createOnboarding,
  deleteOnboardingTask,
  getOnboarding,
  getOnboardingByCandidate,
  listOnboarding,
  setOnboardingStatus,
  updateOnboarding,
  updateOnboardingTask,
} from '@/features/onboarding/api'

const KEY = ['onboarding']

export function useOnboardingList(params) {
  return useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: ({ signal }) => listOnboarding(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useOnboarding(id) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: ({ signal }) => getOnboarding(id, signal),
    enabled: Boolean(id),
  })
}

export function useOnboardingByCandidate(candidateId) {
  return useQuery({
    queryKey: [...KEY, 'by-candidate', candidateId],
    queryFn: ({ signal }) => getOnboardingByCandidate(candidateId, signal),
    enabled: Boolean(candidateId),
    retry: false,
  })
}

function useOnboardingMutation(mutationFn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateOnboarding() {
  return useOnboardingMutation(createOnboarding)
}

export function useUpdateOnboarding() {
  return useOnboardingMutation(({ id, payload }) => updateOnboarding(id, payload))
}

export function useSetOnboardingStatus() {
  return useOnboardingMutation(({ id, status }) => setOnboardingStatus(id, status))
}

export function useUpdateTask() {
  return useOnboardingMutation(({ id, taskId, payload }) =>
    updateOnboardingTask(id, taskId, payload),
  )
}

export function useAddTask() {
  return useOnboardingMutation(({ id, payload }) => addOnboardingTask(id, payload))
}

export function useDeleteTask() {
  return useOnboardingMutation(({ id, taskId }) => deleteOnboardingTask(id, taskId))
}

export function useConvertOnboarding() {
  return useOnboardingMutation(({ id, payload }) => convertOnboarding(id, payload))
}
