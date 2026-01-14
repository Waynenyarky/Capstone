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
