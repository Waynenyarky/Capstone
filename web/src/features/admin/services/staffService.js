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
