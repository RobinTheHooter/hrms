import { HttpClient } from '@/lib/httpClient'

export async function listInterviews({ page = 1, size = 20, status, candidate_id } = {}) {
  return HttpClient('/interviews', {
    params: {
      page,
      size,
      status: status || undefined,
      candidate_id: candidate_id || undefined,
    },
  })
}

export async function scheduleInterview(payload) {
  return HttpClient('/interviews', { method: 'POST', data: payload })
}

export async function updateInterview(id, payload) {
  return HttpClient(`/interviews/${id}`, { method: 'PATCH', data: payload })
}

export async function saveFeedback(id, payload) {
  return HttpClient(`/interviews/${id}/feedback`, { method: 'PATCH', data: payload })
}

export async function recordOutcome(id, payload) {
  return HttpClient(`/interviews/${id}/outcome`, { method: 'PATCH', data: payload })
}

export async function bulkDeleteInterviews(ids) {
  return HttpClient('/interviews/bulk-delete', { method: 'POST', data: { ids } })
}

export async function deleteInterview(id) {
  await HttpClient(`/interviews/${id}`, { method: 'DELETE' })
}

/* Active hiring managers for the scheduling dropdown (any authed user). */
export async function listHiringManagers() {
  return HttpClient('/meta/users', {
    params: { role: 'hiring_manager' },
  })
}

/* A manager's busy blocks for a given date (YYYY-MM-DD). */
export async function getAvailability(managerId, date) {
  return HttpClient('/interviews/availability', {
    params: { manager_id: managerId, date },
  })
}
