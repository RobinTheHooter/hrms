import { apiClient } from '@/lib/apiClient'

export async function listInterviews({ page = 1, size = 20, status, candidate_id } = {}) {
  const { data } = await apiClient.get('/interviews', {
    params: {
      page,
      size,
      status: status || undefined,
      candidate_id: candidate_id || undefined,
    },
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

export async function saveFeedback(id, payload) {
  const { data } = await apiClient.patch(`/interviews/${id}/feedback`, payload)
  return data
}

export async function recordOutcome(id, payload) {
  const { data } = await apiClient.patch(`/interviews/${id}/outcome`, payload)
  return data
}

export async function bulkDeleteInterviews(ids) {
  const { data } = await apiClient.post('/interviews/bulk-delete', { ids })
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

/** A manager's busy blocks for a given date (YYYY-MM-DD). */
export async function getAvailability(managerId, date) {
  const { data } = await apiClient.get('/interviews/availability', {
    params: { manager_id: managerId, date },
  })
  return data // { connected, busy: [{ start, end }] }
}
