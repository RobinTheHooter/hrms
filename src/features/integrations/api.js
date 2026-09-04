import { HttpClient } from '@/lib/httpClient'

export async function getGoogleStatus(signal) {
  return HttpClient('/integrations/google/status', {}, signal)
}

export async function getGoogleConnectUrl() {
  const data = await HttpClient('/integrations/google/connect')
  return data.url
}

export async function disconnectGoogle() {
  await HttpClient('/integrations/google', { method: 'DELETE' })
}
