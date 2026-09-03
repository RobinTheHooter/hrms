import { HttpClient } from '@/lib/httpClient'

export async function listOffers(candidateId) {
  return HttpClient('/offers', {
    params: { candidate_id: candidateId },
  })
}

export async function createOffer(payload) {
  return HttpClient('/offers', { method: 'POST', data: payload })
}

export async function updateOffer(id, payload) {
  return HttpClient(`/offers/${id}`, { method: 'PATCH', data: payload })
}

export async function setOfferStatus(id, status) {
  return HttpClient(`/offers/${id}/status`, { method: 'POST', data: { status } })
}
