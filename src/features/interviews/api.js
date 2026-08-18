import { apiClient } from '@/lib/apiClient'

export async function listInterviews({ page = 1, size = 20, status } = {}) {
  const { data } = await apiClient.get('/interviews', {
    params: { page, size, status: status || undefined },
  })
  return data
}

export async function scheduleInterview(payload) {
  const { data } = await apiClient.post('/interviews', payload)
  return data
}

export async function updateInterview(id, payload) {
  const { data } = await apiClient.patch(`/interviews/${id}`, payload)
  return data
}

export async function recordOutcome(id, payload) {
  const { data } = await apiClient.patch(`/interviews/${id}/outcome`, payload)
  return data
}

export async function deleteInterview(id) {
  await apiClient.delete(`/interviews/${id}`)
}

/** Active hiring managers for the scheduling dropdown (any authed user). */
export async function listHiringManagers() {
  const { data } = await apiClient.get('/meta/users', {
    params: { role: 'hiring_manager' },
  })
  return data // [{ id, full_name }]
}
