import { apiClient } from '@/lib/apiClient'

export async function listEmployees(params = {}) {
  const { data } = await apiClient.get('/employees', { params })
  return data // expected: array of employees (adjust when backend is built)
}
