import { useCallback } from 'react'
import { App } from 'antd'
import { useSupportedServiceAreas } from "@/hooks/useSupportedServiceAreas.js"
import { useAuthSession } from "@/features/authentication"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { authHeaders } from "@/lib/authHeaders.js"
import { notifySupportedAreasUpdated } from "@/features/admin/areas/lib/supportedAreasEvents.js"
import { useNotifier } from '@/shared/notifications.js'

export function useAddSupportedAreas() {
  const { areasByProvince, isLoading, reloadAreas, setAreasByProvince } = useSupportedServiceAreas()
  const { currentUser } = useAuthSession()
  const { success, error } = useNotifier()

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
  }, [currentUser, setAreasByProvince, success, error])

  return { areasByProvince, isLoading, reloadAreas, saveAreas }
}