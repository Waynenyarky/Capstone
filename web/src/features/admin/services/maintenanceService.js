import { authHeaders, fetchJsonWithFallback } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

export async function requestMaintenance(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/admin/maintenance/request', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function getMaintenanceCurrent() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback('/api/admin/maintenance/current', {
    method: 'GET',
    headers,
  })
}

export async function getMaintenancePublicStatus() {
  return fetchJsonWithFallback('/api/maintenance/status', { method: 'GET' })
}

export async function getMaintenanceApprovals() {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin')
  return fetchJsonWithFallback('/api/admin/approvals?requestType=maintenance_mode', {
    method: 'GET',
    headers,
  })
}

export async function approveMaintenance(approvalId, approved = true, comment = '') {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`/api/admin/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ approved, comment }),
  })
}
