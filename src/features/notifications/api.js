import { HttpClient } from '@/lib/httpClient'

export async function getNotifications(signal) {
  return HttpClient('/notifications', {}, signal)
}
