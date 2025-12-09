import { fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'

export async function getUserProfile(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/auth/me', { headers })
}

export async function updateUserProfile(payload, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/profile', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}
