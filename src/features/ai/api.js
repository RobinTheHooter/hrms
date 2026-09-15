import { HttpClient } from '@/lib/httpClient'

export async function generateInterviewQuestions(payload) {
  return HttpClient('/ai/interview-questions', { method: 'POST', data: payload })
}

export async function draftCandidateEmail(payload) {
  return HttpClient('/ai/email-draft', { method: 'POST', data: payload })
}

export async function getScreeningInsights(payload) {
  return HttpClient('/ai/screening-insights', { method: 'POST', data: payload })
}
