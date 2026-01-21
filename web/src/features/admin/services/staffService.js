import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getStaffList() {
  const data = await fetchJsonWithFallback('/api/auth/staff', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.staff || [])
}

export async function createStaff(payload) {
  return await fetchJsonWithFallback('/api/auth/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateStaff(staffId, payload) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff/${staffId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function resetStaffPassword(staffId, payload) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff/${staffId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getOffices() {
  const data = await fetchJsonWithFallback('/api/auth/admin/offices', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.offices || [])
}

export async function createOffice(payload) {
  return await fetchJsonWithFallback('/api/auth/admin/offices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateOffice(officeId, payload) {
  return await fetchJsonWithFallback(`/api/auth/admin/offices/${officeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteOffice(officeId) {
  return await fetchJsonWithFallback(`/api/auth/admin/offices/${officeId}`, {
    method: 'DELETE',
  })
}

export async function getStaffRoles() {
  const data = await fetchJsonWithFallback('/api/auth/admin/staff-roles', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.roles || [])
}

export async function createStaffRole(payload) {
  return await fetchJsonWithFallback('/api/auth/admin/staff-roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateStaffRole(roleId, payload) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff-roles/${roleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteStaffRole(roleId) {
  return await fetchJsonWithFallback(`/api/auth/admin/staff-roles/${roleId}`, {
    method: 'DELETE',
  })
}
