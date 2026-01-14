import { authHeaders } from '@/lib/http.js'
import { fetchJsonWithFallback, fetchWithFallback } from '@/lib/http.js'

/**
 * Get audit history for current user
 * @param {Object} params - { page, limit, startDate?, endDate?, eventType? }
 */
export async function getAuditHistory(params, currentUser, role) {
  const headers = authHeaders(currentUser, role)
  const queryParams = new URLSearchParams(params).toString()
  return fetchJsonWithFallback(`/api/auth/profile/audit-history?${queryParams}`, {
    method: 'GET',
    headers,
  })
}

/**
 * Export audit history
 * @param {string} format - 'csv' or 'pdf'
 * @param {Object} params - Filter parameters
 */
export async function exportAuditHistory(format, params, currentUser, role) {
  const headers = authHeaders(currentUser, role)
  const queryParams = new URLSearchParams({ ...params, format }).toString()
  
  const response = await fetchWithFallback(`/api/auth/profile/audit-history/export?${queryParams}`, {
    method: 'GET',
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Export failed' }))
    throw new Error(error.message || 'Export failed')
  }
  
  return response.blob()
}
