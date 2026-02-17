import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getAuditHistoryAdmin(params = {}) {
  const queryParams = new URLSearchParams(params).toString()
  return fetchJsonWithFallback(`/api/auth/audit/history?${queryParams}`, {
    method: 'GET',
  })
}

export async function getRecentAuditActivityAdmin(params = {}) {
  const queryParams = new URLSearchParams(params).toString()
  const url = queryParams ? `/api/auth/audit/admin/recent?${queryParams}` : '/api/auth/audit/admin/recent'
  return fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getAllAuditLogsAdmin(params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  )
  const queryParams = new URLSearchParams(filtered).toString()
  return fetchJsonWithFallback(`/api/auth/audit/admin/all?${queryParams}`, {
    method: 'GET',
  })
}
