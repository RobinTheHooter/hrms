import { HttpClient } from '@/lib/httpClient'

export async function getGoogleStatus() {
  return HttpClient('/integrations/google/status')
}

export async function getGoogleConnectUrl() {
  const data = await HttpClient('/integrations/google/connect')
  return data.url
}

export async function disconnectGoogle() {
  await HttpClient('/integrations/google', { method: 'DELETE' })
}
