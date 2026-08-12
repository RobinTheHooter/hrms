import { apiClient } from '@/lib/apiClient'

export async function listUsers({ page = 1, size = 20, search } = {}) {
  const { data } = await apiClient.get('/users', {
    params: { page, size, search: search || undefined },
  })
  return data // Page: { items, total, page, size, pages }
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.patch(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id) {
  await apiClient.delete(`/users/${id}`)
}
