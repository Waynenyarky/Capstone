import { useCallback, useEffect, useMemo, useState } from 'react'
import { App } from 'antd'
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

// Returns province-city mappings and a flattened list of all allowed cities
export function useSupportedServiceAreas() {
  const { error } = useNotifier()
  const [areasByProvince, setAreasByProvince] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadAreas = useCallback(async () => {
    setIsLoading(true)
    const res = await fetchWithFallback('/api/service-areas')
    if (!res || !res.ok) {
      error('Failed to load supported service areas')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setAreasByProvince(list)
    setIsLoading(false)
  }, [error])

  useEffect(() => {
    reloadAreas()
  }, [reloadAreas])

  const allCities = useMemo(() => {
    return areasByProvince.flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
  }, [areasByProvince])

  return { areasByProvince, allCities, isLoading, reloadAreas, setAreasByProvince }
}