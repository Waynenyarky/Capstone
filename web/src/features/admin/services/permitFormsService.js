import { authHeaders, fetchJsonWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

const BASE = '/api/admin/permit-forms'

export async function getPermitForms() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback(BASE, { method: 'GET', headers })
}

export async function getPermitFormsPublic() {
  return fetchJsonWithFallback(BASE, { method: 'GET', skipAuth: true })
}

export async function saveDraft(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(BASE, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function publishPermitForms() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback(`${BASE}/publish`, { method: 'POST', headers })
}

export async function revertPermitForms() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback(`${BASE}/revert`, { method: 'POST', headers })
}

export async function togglePermitForms(isEnabled) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`${BASE}/enable`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ isEnabled }),
  })
}

export async function uploadPermitFormFile(file) {
  const current = getCurrentUser()
  const formData = new FormData()
  formData.append('file', file)
  const headers = authHeaders(current, 'admin')
  // Remove Content-Type so browser sets multipart boundary
  delete headers['Content-Type']
  return fetchJsonWithFallback(`${BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
}

export async function getPermitFormsAudit(page = 1, limit = 20) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return fetchJsonWithFallback(`${BASE}/audit?${params.toString()}`, { method: 'GET', headers })
}
