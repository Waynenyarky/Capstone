import { authHeaders, fetchJsonWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

export async function fetchTamperIncidents(params = {}) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.severity) search.set('severity', params.severity)
  if (params.limit) search.set('limit', params.limit)

  const qs = search.toString()
  const path = qs ? `/api/admin/tamper/incidents?${qs}` : '/api/admin/tamper/incidents'

  return fetchJsonWithFallback(path, {
    method: 'GET',
    headers,
  })
}

export async function fetchTamperStats() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback('/api/admin/tamper/incidents/stats', {
    method: 'GET',
    headers,
  })
}

export async function acknowledgeIncident(id, containmentActive) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`/api/admin/tamper/incidents/${id}/ack`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ containmentActive }),
  })
}

export async function updateContainment(id, containmentActive = true) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`/api/admin/tamper/incidents/${id}/contain`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ containmentActive }),
  })
}

export async function resolveIncident(id, resolutionNotes = '', containmentActive = false) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`/api/admin/tamper/incidents/${id}/resolve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ resolutionNotes, containmentActive }),
  })
}
