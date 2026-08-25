import { apiClient } from '@/lib/apiClient'

export async function listOffers(candidateId) {
  const { data } = await apiClient.get('/offers', {
    params: { candidate_id: candidateId },
  })
  return data
}

export async function createOffer(payload) {
  const { data } = await apiClient.post('/offers', payload)
  return data
}

export async function updateOffer(id, payload) {
  const { data } = await apiClient.patch(`/offers/${id}`, payload)
  return data
}

export async function setOfferStatus(id, status) {
  const { data } = await apiClient.post(`/offers/${id}/status`, { status })
  return data
}
