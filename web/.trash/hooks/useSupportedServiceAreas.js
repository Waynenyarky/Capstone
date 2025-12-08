// Lightweight stub for useSupportedServiceAreas
// Purpose: keep the same public API used across the app while simplifying behavior.
import { useCallback, useMemo, useState } from 'react'

export function useSupportedServiceAreas() {
  // Keep the same return shape as the original hook.
  const [areasByProvince, setAreasByProvince] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // reloadAreas is a no-op stub. Callers can still invoke it safely.
  const reloadAreas = useCallback(async () => {
    setIsLoading(false)
    // noop: in a stub, we don't perform network requests.
    return
  }, [])

  const allCities = useMemo(() => {
    return areasByProvince.flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
  }, [areasByProvince])

  return { areasByProvince, allCities, isLoading, reloadAreas, setAreasByProvince }
}
