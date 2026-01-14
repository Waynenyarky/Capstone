import { authHeaders } from '@/lib/http.js'
import { fetchJsonWithFallback } from '@/lib/http.js'

/**
 * Get pending approvals for current user
 */
export async function getPendingApprovals(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/auth/profile/approvals/pending', {
    method: 'GET',
    headers,
  })
}
