import { authHeaders, fetchJsonWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

/**
 * GET /api/admin/monitoring/services-health
 * Returns { services: [{ key, name, status, ok, database?, error? }], timestamp }.
 */
export async function getServicesHealth() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback('/api/admin/monitoring/services-health', {
    method: 'GET',
    headers,
  })
}
