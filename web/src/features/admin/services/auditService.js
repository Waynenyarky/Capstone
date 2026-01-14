import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getAuditHistoryAdmin(params = {}) {
  const queryParams = new URLSearchParams(params).toString()
  return fetchJsonWithFallback(`/api/auth/audit/history?${queryParams}`, {
    method: 'GET',
  })
}
