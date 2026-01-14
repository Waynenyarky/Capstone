import { authHeaders } from '@/lib/http.js'
import { fetchJsonWithFallback } from '@/lib/http.js'

/**
 * Get notification history
 */
export async function getNotificationHistory(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/auth/profile/notifications/history', {
    method: 'GET',
    headers,
  })
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/profile/notifications/preferences', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(preferences),
  })
}
