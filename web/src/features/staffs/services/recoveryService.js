import { authHeaders, fetchJsonWithFallback, fetchWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

/**
 * Staff recovery — request and temporary credential login
 */
export async function requestRecovery(payload = {}) {
  const current = getCurrentUser()
  const headers = authHeaders(current, current?.role || null, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/staff/recovery-request', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function getRecoveryStatus() {
  const current = getCurrentUser()
  const headers = authHeaders(current, current?.role || null)
  // Endpoint may not exist yet; surface non-OK as errors for caller to handle gracefully
  const res = await fetchWithFallback('/api/auth/staff/recovery-status', {
    method: 'GET',
    headers,
  })
  if (!res?.ok) {
    const body = await res?.json().catch(() => ({}))
    return Promise.reject({ status: res?.status, body })
  }
  return res.json()
}

export async function loginWithTemporaryCredentials(payload = {}) {
  return fetchJsonWithFallback('/api/auth/staff/login-temporary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
