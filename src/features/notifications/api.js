import { HttpClient } from '@/lib/httpClient'

export async function getNotifications() {
  return HttpClient('/notifications')
}
