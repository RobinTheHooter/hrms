import { apiClient } from '@/lib/apiClient'

export async function getGoogleStatus() {
  const { data } = await apiClient.get('/integrations/google/status')
  return data // { enabled, connected, email }
}

export async function getGoogleConnectUrl() {
  const { data } = await apiClient.get('/integrations/google/connect')
  return data.url
}

export async function disconnectGoogle() {
  await apiClient.delete('/integrations/google')
}
