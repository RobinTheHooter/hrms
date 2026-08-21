import { apiClient } from '@/lib/apiClient'

export async function getNotifications() {
  const { data } = await apiClient.get('/notifications')
  return data
}
