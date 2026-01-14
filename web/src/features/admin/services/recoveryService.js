import { authHeaders, fetchJsonWithFallback, fetchWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

export async function getRecoveryRequests(params = {}) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  const query = new URLSearchParams(params).toString()
  const url = query ? `/api/auth/admin/recovery-requests?${query}` : '/api/auth/admin/recovery-requests'
  return fetchJsonWithFallback(url, { method: 'GET', headers })
}

export async function issueTemporaryCredentials(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/admin/issue-temporary-credentials', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function denyRecoveryRequest(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/admin/deny-recovery-request', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}
