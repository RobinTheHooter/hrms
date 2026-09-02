import { HttpClient } from '@/lib/httpClient'

export async function listEmployees({ page = 1, size = 20, search } = {}) {
  return HttpClient('/employees', {
    params: { page, size, search: search || undefined },
  })
}

export async function getEmployee(id) {
  return HttpClient(`/employees/${id}`)
}

export async function createEmployee(payload) {
  return HttpClient('/employees', { method: 'POST', data: payload })
}

export async function updateEmployee(id, payload) {
  return HttpClient(`/employees/${id}`, { method: 'PATCH', data: payload })
}

export async function deleteEmployee(id) {
  await HttpClient(`/employees/${id}`, { method: 'DELETE' })
}
