import { authHeaders, fetchJsonWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

export async function getActiveSessions() {
  const current = getCurrentUser()
  const headers = authHeaders(current, null)
  return fetchJsonWithFallback('/api/auth/session/active', { method: 'GET', headers })
}

export async function invalidateSession(sessionId) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/session/invalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId }),
  })
}

export async function invalidateAllSessions() {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/session/invalidate-all', {
    method: 'POST',
    headers,
  })
}

export async function postSessionActivity() {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/session/activity', {
    method: 'POST',
    headers,
  })
}
