import { fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

function authOpts(extra) {
  const current = getCurrentUser()
  return authHeaders(current, 'admin', { 'Content-Type': 'application/json', ...(extra || {}) })
}

export async function getStaffList() {
  const data = await fetchJsonWithFallback('/api/auth/staff', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.staff || [])
}

export async function createStaff(payload, options = {}) {
  return await fetchJsonWithFallback('/api/auth/staff', {
    method: 'POST',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function updateStaff(staffId, payload, options = {}) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff/${staffId}`, {
    method: 'PATCH',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function resetStaffPassword(staffId, payload, options = {}) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff/${staffId}/reset-password`, {
    method: 'POST',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function getOffices() {
  const data = await fetchJsonWithFallback('/api/auth/admin/offices', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.offices || [])
}

export async function createOffice(payload, options = {}) {
  return await fetchJsonWithFallback('/api/auth/admin/offices', {
    method: 'POST',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function updateOffice(officeId, payload, options = {}) {
  return await fetchJsonWithFallback(`/api/auth/admin/offices/${officeId}`, {
    method: 'PATCH',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function deleteOffice(officeId, options = {}) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', options.stepUpToken && { stepUpToken: options.stepUpToken })
  return await fetchJsonWithFallback(`/api/auth/admin/offices/${officeId}`, {
    method: 'DELETE',
    headers,
  })
}

export async function getStaffRoles() {
  const data = await fetchJsonWithFallback('/api/auth/admin/staff-roles', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.roles || [])
}

export async function createStaffRole(payload, options = {}) {
  return await fetchJsonWithFallback('/api/auth/admin/staff-roles', {
    method: 'POST',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function updateStaffRole(roleId, payload, options = {}) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff-roles/${roleId}`, {
    method: 'PATCH',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function deleteStaffRole(roleId, options = {}) {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', options.stepUpToken && { stepUpToken: options.stepUpToken })
  return await fetchJsonWithFallback(`/api/auth/admin/staff-roles/${roleId}`, {
    method: 'DELETE',
    headers,
  })
}

// ─── Admin Account Management ───

export async function getAdminList() {
  const data = await fetchJsonWithFallback('/api/auth/admin/admins', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.admins || [])
}

export async function requestAdminChange(adminId, payload, options = {}) {
  return await fetchJsonWithFallback(`/api/auth/admin/admins/${adminId}/request-change`, {
    method: 'POST',
    headers: authOpts(options?.stepUpToken ? { stepUpToken: options.stepUpToken } : null),
    body: JSON.stringify(payload),
  })
}

export async function getAdminPendingApprovals(adminId) {
  const data = await fetchJsonWithFallback(`/api/auth/admin/admins/${adminId}/pending-approvals`, { method: 'GET' })
  return data?.approvals || []
}
