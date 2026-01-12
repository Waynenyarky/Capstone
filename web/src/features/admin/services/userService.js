import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getAllUsers() {
  const data = await fetchJsonWithFallback('/api/auth/users', { method: 'GET' })
  return Array.isArray(data) ? data : (data?.users || [])
}
