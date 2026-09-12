import { HttpClient } from '@/lib/httpClient'

export async function listOnboarding(
  { page = 1, size = 50, search, status } = {},
  signal,
) {
  return HttpClient(
    '/onboarding',
    {
      params: {
        page,
        size,
        search: search || undefined,
        onboarding_status: status || undefined,
      },
    },
    signal,
  )
}

export async function getOnboarding(id, signal) {
  return HttpClient(`/onboarding/${id}`, {}, signal)
}

export async function createOnboarding(payload) {
  return HttpClient('/onboarding', { method: 'POST', data: payload })
}

export async function updateOnboarding(id, payload) {
  return HttpClient(`/onboarding/${id}`, { method: 'PATCH', data: payload })
}

export async function setOnboardingStatus(id, status) {
  return HttpClient(`/onboarding/${id}/status`, {
    method: 'POST',
    data: { status },
  })
}

export async function updateOnboardingTask(id, taskId, payload) {
  return HttpClient(`/onboarding/${id}/tasks/${taskId}`, {
    method: 'PATCH',
    data: payload,
  })
}

export async function addOnboardingTask(id, payload) {
  return HttpClient(`/onboarding/${id}/tasks`, { method: 'POST', data: payload })
}

export async function deleteOnboardingTask(id, taskId) {
  return HttpClient(`/onboarding/${id}/tasks/${taskId}`, { method: 'DELETE' })
}

export async function convertOnboarding(id, payload) {
  return HttpClient(`/onboarding/${id}/convert`, {
    method: 'POST',
    data: payload,
  })
}
