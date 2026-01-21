import { fetchJsonWithFallback } from '@/lib/http.js'

export async function getMaintenanceStatus() {
  const ts = Date.now()
  return fetchJsonWithFallback(`/api/maintenance/status?ts=${ts}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}
