import { HttpClient } from '@/lib/httpClient'

export async function listJobs({ page = 1, size = 20, search, status } = {}) {
  return HttpClient('/jobs', {
    params: {
      page,
      size,
      search: search || undefined,
      status: status || undefined,
    },
  })
}

export async function getJob(id) {
  return HttpClient(`/jobs/${id}`)
}

export async function createJob(payload) {
  return HttpClient('/jobs', { method: 'POST', data: payload })
}

export async function updateJob(id, payload) {
  return HttpClient(`/jobs/${id}`, { method: 'PATCH', data: payload })
}

export async function deleteJob(id) {
  await HttpClient(`/jobs/${id}`, { method: 'DELETE' })
}

export async function bulkDeleteJobs(ids) {
  return HttpClient('/jobs/bulk-delete', { method: 'POST', data: { ids } })
}

export async function generateJobDescription(payload) {
  return HttpClient('/jobs/ai/description', { method: 'POST', data: payload })
}

/* Consultants for the "assign" dropdown (admin/HR only). */
export async function listConsultants() {
  const data = await HttpClient('/users', {
    params: { role: 'consultant', size: 100 },
  })
  return data.items ?? []
}
