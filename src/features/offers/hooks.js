import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createOffer,
  listOffers,
  setOfferStatus,
  updateOffer,
} from '@/features/offers/api'

const KEY = ['offers']

export function useOffers(candidateId) {
  return useQuery({
    queryKey: [...KEY, candidateId],
    queryFn: () => listOffers(candidateId),
    enabled: Boolean(candidateId),
  })
}

// Offer changes can move the candidate's pipeline stage, so invalidate both.
function useOfferMutation(mutationFn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useCreateOffer() {
  return useOfferMutation(createOffer)
}

export function useUpdateOffer() {
  return useOfferMutation(({ id, payload }) => updateOffer(id, payload))
}

export function useSetOfferStatus() {
  return useOfferMutation(({ id, status }) => setOfferStatus(id, status))
}
