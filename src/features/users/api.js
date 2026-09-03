import { HttpClient } from '@/lib/httpClient'

export async function listUsers({ page = 1, size = 20, search } = {}) {
  return HttpClient('/users', {
    params: { page, size, search: search || undefined },
  })
}

export async function createUser(payload) {
  return HttpClient('/users', { method: 'POST', data: payload })
}

export async function updateUser(id, payload) {
  return HttpClient(`/users/${id}`, { method: 'PATCH', data: payload })
}

export async function deleteUser(id) {
  await HttpClient(`/users/${id}`, { method: 'DELETE' })
}

export async function bulkDeleteUsers(ids) {
  return HttpClient('/users/bulk-delete', { method: 'POST', data: { ids } })
}
