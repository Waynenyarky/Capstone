import { get, post, put, del } from '@/lib/http.js'

const BASE = '/api/business/admin/lob-trainer'

export async function getLobTrainerStats() {
  return get(`${BASE}/stats`)
}

export async function getLobTrainingExamples(params = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  if (params.search) qs.set('search', params.search)
  if (params.taxCode) qs.set('taxCode', params.taxCode)
  const query = qs.toString()
  return get(`${BASE}/examples${query ? `?${query}` : ''}`)
}

export async function createLobTrainingExample(data) {
  return post(`${BASE}/examples`, data)
}

export async function updateLobTrainingExample(id, data) {
  return put(`${BASE}/examples/${id}`, data)
}

export async function deleteLobTrainingExample(id) {
  return del(`${BASE}/examples/${id}`)
}

export async function triggerLobModelTraining() {
  return post(`${BASE}/train`, {})
}

export async function getLobAudit(params = {}) {
  const qs = new URLSearchParams()
  if (params.threshold != null) qs.set('threshold', String(params.threshold))
  const query = qs.toString()
  return get(`${BASE}/audit${query ? `?${query}` : ''}`)
}

export async function getLobEvaluation() {
  return get(`${BASE}/evaluate`)
}

export async function getGeminiStatus() {
  return get(`${BASE}/gemini-status`)
}

/** Call LOB recommendation API (same as business form) for "Try model" sandbox. */
export async function getLobRecommendations(businessDescription) {
  return post('/api/business/ai/recommend-line-of-business', { businessDescription: String(businessDescription).trim() }, { timeoutMs: 30000 })
}

export async function exportLobExamplesCsv() {
  return get(`${BASE}/examples/export?format=csv&limit=10000`)
}

export async function importLobExamplesCsv(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { fetchWithFallback } = await import('@/lib/http.js')
  const res = await fetchWithFallback(`${BASE}/examples/import`, { method: 'POST', body: formData })
  if (!res || !res.ok) {
    const err = await res?.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.message || `Import failed: ${res?.status}`)
  }
  return res.json()
}
