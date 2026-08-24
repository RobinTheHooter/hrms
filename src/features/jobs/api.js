import { apiClient } from '@/lib/apiClient'

export async function listJobs({ page = 1, size = 20, search, status } = {}) {
  const { data } = await apiClient.get('/jobs', {
    params: { page, size, search: search || undefined, status: status || undefined },
  })
  return data // Page: { items, total, page, size, pages }
}

export async function getJob(id) {
  const { data } = await apiClient.get(`/jobs/${id}`)
  return data
}

export async function createJob(payload) {
  const { data } = await apiClient.post('/jobs', payload)
  return data
}

export async function updateJob(id, payload) {
  const { data } = await apiClient.patch(`/jobs/${id}`, payload)
  return data
}

export async function deleteJob(id) {
  await apiClient.delete(`/jobs/${id}`)
}

/** Consultants for the "assign" dropdown (admin/HR only). */
export async function listConsultants() {
  const { data } = await apiClient.get('/users', {
    params: { role: 'consultant', size: 100 },
  })
  return data.items ?? []
}
