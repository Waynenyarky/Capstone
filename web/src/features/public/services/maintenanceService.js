import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getMaintenanceStatus() {
  return fetchJsonWithFallback('/api/maintenance/status', { method: 'GET' })
}
