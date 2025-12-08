import { useCallback, useState, useEffect } from 'react'
import { fetchWithFallback, fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'
import { notifySupportedAreasUpdated } from '@/features/admin/areas/lib/supportedAreasEvents.js'
import { useAuthSession } from '@/features/authentication'
import { useNotifier } from '@/shared/notifications.js'

export function useAddSupportedAreas() {
  const { currentUser } = useAuthSession()
  const { success, error } = useNotifier()

  // Local supported-service-areas state (replaces useSupportedServiceAreas hook)
  const [areasByProvince, setAreasByProvince] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadAreas = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchWithFallback('/api/service-areas')
      if (!res || !res.ok) {
        error('Failed to load supported service areas')
        setIsLoading(false)
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setAreasByProvince(list)
    } catch (err) {
      error('Failed to load supported service areas')
    } finally {
      setIsLoading(false)
    }
  }, [error])

  useEffect(() => { reloadAreas() }, [reloadAreas])

  const saveAreas = useCallback(async (nextAreasByProvince) => {
    const payload = { areas: Array.isArray(nextAreasByProvince) ? nextAreasByProvince : [] }
    const headers = authHeaders(currentUser, 'admin', { 'Content-Type': 'application/json' })

    try {
      const data = await fetchJsonWithFallback('/api/service-areas', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
      const list = Array.isArray(data) ? data : []
      setAreasByProvince(list)
      notifySupportedAreasUpdated(list)
      success('Service areas updated')
      return { saved: true }
    } catch (err) {
      error('Failed to save service areas')
      void err
      return { saved: false }
    }
  }, [currentUser, success, error])

  return { areasByProvince, isLoading, reloadAreas, saveAreas, setAreasByProvince }
}