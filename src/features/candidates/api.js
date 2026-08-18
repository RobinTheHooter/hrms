import { apiClient } from '@/lib/apiClient'

export async function listCandidates({ page = 1, size = 20, search, stage, jobId } = {}) {
  const { data } = await apiClient.get('/candidates', {
    params: {
      page,
      size,
      search: search || undefined,
      stage: stage || undefined,
      job_id: jobId || undefined,
    },
  })
  return data
}

export async function createCandidate(payload) {
  const { data } = await apiClient.post('/candidates', payload)
  return data
}

export async function updateCandidate(id, payload) {
  const { data } = await apiClient.patch(`/candidates/${id}`, payload)
  return data
}

export async function deleteCandidate(id) {
  await apiClient.delete(`/candidates/${id}`)
}
