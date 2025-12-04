import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"

export function useCitiesOptions(province) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadCities() {
      if (!province) {
        setOptions([])
        return
      }
      setLoading(true)
      const params = new URLSearchParams({ province })
      const res = await fetchWithFallback(`/api/locations/cities?${params.toString()}`)
      let data = []
      if (res && res.ok) {
        try { data = await res.json() } catch { data = [] }
      }
      if (!cancelled) {
        setOptions((Array.isArray(data) ? data : []).map((c) => ({ label: c.name || c, value: c.value || c })))
        setLoading(false)
      }
    }
    loadCities()
    return () => { cancelled = true }
  }, [province])

  return { options, loading }
}