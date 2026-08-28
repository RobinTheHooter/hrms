import { apiClient } from '@/lib/apiClient'

export async function listCandidates({
  page = 1,
  size = 20,
  search,
  stage,
  source,
  jobId,
  min_score,
  sort,
} = {}) {
  const { data } = await apiClient.get('/candidates', {
    params: {
      page,
      size,
      search: search || undefined,
      stage: stage || undefined,
      source: source || undefined,
      job_id: jobId || undefined,
      min_score: min_score ?? undefined,
      sort: sort || undefined,
    },
  })
  return data
}

export async function getCandidate(id) {
  const { data } = await apiClient.get(`/candidates/${id}`)
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

export async function bulkDeleteCandidates(ids) {
  const { data } = await apiClient.post('/candidates/bulk-delete', { ids })
  return data
}

export async function bulkUploadCandidates(jobId, files, sendAck = false) {
  const form = new FormData()
  form.append('job_id', jobId)
  form.append('send_ack', sendAck ? 'true' : 'false')
  for (const file of files) form.append('files', file)
  const { data } = await apiClient.post('/candidates/bulk-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data // { total, created, emailed, results: [{ filename, status, name, email, candidate_id, error }] }
}

export async function getEmailTemplates(id) {
  const { data } = await apiClient.get(`/candidates/${id}/email-templates`)
  return data // { enabled, candidate_email, templates: [{ key, label, subject, body }] }
}

export async function notifyCandidate(id, payload) {
  await apiClient.post(`/candidates/${id}/notify`, payload)
}

export async function uploadResume(id, file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post(`/candidates/${id}/resume`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function scoreCandidate(id) {
  const { data } = await apiClient.post(`/candidates/${id}/score`)
  return data
}

export async function downloadResume(id) {
  const res = await apiClient.get(`/candidates/${id}/resume/file`, {
    responseType: 'blob',
  })
  return res.data
}
