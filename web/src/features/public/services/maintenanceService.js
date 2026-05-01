import { fetchJsonWithFallback } from '@/lib/http.js'

/**
 * Returns current maintenance mode status from the backend.
 * In development, skips the request by default so you don't get 502 in the console
 * when the backend isn't running. Set VITE_CHECK_MAINTENANCE=true to hit the real API in dev.
 */
export async function getMaintenanceStatus() {
  const isDev = import.meta.env.DEV
  const checkInDev = import.meta.env.VITE_CHECK_MAINTENANCE === 'true' || import.meta.env.VITE_CHECK_MAINTENANCE === '1'
  if (isDev && !checkInDev) {
    return Promise.resolve({ active: false })
  }

  const ts = Date.now()
  // 8-second timeout to avoid indefinite hang blocking page load
  return fetchJsonWithFallback(`/api/maintenance/status?ts=${ts}`, {
    method: 'GET',
    timeoutMs: 8000,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
}
