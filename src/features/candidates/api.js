import { HttpClient } from '@/lib/httpClient'

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
  return HttpClient('/candidates', {
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
}

export async function getCandidate(id) {
  return HttpClient(`/candidates/${id}`)
}

export async function createCandidate(payload) {
  return HttpClient('/candidates', { method: 'POST', data: payload })
}

export async function updateCandidate(id, payload) {
  return HttpClient(`/candidates/${id}`, { method: 'PATCH', data: payload })
}

export async function deleteCandidate(id) {
  await HttpClient(`/candidates/${id}`, { method: 'DELETE' })
}

export async function bulkDeleteCandidates(ids) {
  return HttpClient('/candidates/bulk-delete', { method: 'POST', data: { ids } })
}

export async function bulkUploadCandidates(jobId, files, sendAck = false) {
  const form = new FormData()
  form.append('job_id', jobId)
  form.append('send_ack', sendAck ? 'true' : 'false')
  for (const file of files) form.append('files', file)

  return HttpClient('/candidates/bulk-upload', { method: 'POST', data: form })
}

export async function getEmailTemplates(id) {
  return HttpClient(`/candidates/${id}/email-templates`)
}

export async function notifyCandidate(id, payload) {
  await HttpClient(`/candidates/${id}/notify`, { method: 'POST', data: payload })
}

export async function uploadResume(id, file) {
  const form = new FormData()
  form.append('file', file)
  return HttpClient(`/candidates/${id}/resume`, { method: 'POST', data: form })
}

export async function scoreCandidate(id) {
  return HttpClient(`/candidates/${id}/score`, { method: 'POST' })
}

export async function downloadResume(id) {
  const res = await HttpClient(`/candidates/${id}/resume/file`, {
    responseType: 'blob',
  })
  return res.data
}
