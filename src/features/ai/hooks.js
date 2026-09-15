import { useMutation } from '@tanstack/react-query'

import {
  draftCandidateEmail,
  generateInterviewQuestions,
  getScreeningInsights,
} from '@/features/ai/api'

export function useInterviewQuestions() {
  return useMutation({ mutationFn: generateInterviewQuestions })
}

export function useEmailDraft() {
  return useMutation({ mutationFn: draftCandidateEmail })
}

export function useScreeningInsights() {
  return useMutation({ mutationFn: getScreeningInsights })
}
