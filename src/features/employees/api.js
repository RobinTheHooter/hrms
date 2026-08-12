import { apiClient } from '@/lib/apiClient'

export async function listEmployees({ page = 1, size = 20, search } = {}) {
  const { data } = await apiClient.get('/employees', {
    params: { page, size, search: search || undefined },
  })
  return data // Page: { items, total, page, size, pages }
}

export async function getEmployee(id) {
  const { data } = await apiClient.get(`/employees/${id}`)
  return data
}

export async function createEmployee(payload) {
  const { data } = await apiClient.post('/employees', payload)
  return data
}

export async function updateEmployee(id, payload) {
  const { data } = await apiClient.patch(`/employees/${id}`, payload)
  return data
}

export async function deleteEmployee(id) {
  await apiClient.delete(`/employees/${id}`)
}
