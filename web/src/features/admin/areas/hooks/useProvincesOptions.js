import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"

export function useProvincesOptions() {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProvinces() {
      setLoading(true)
      const res = await fetchWithFallback('/api/locations/provinces')
      let data = []
      if (res && res.ok) {
        try { data = await res.json() } catch { data = [] }
      }
      if (!cancelled) {
        setOptions((Array.isArray(data) ? data : []).map((p) => ({ label: p.name || p, value: p.value || p })))
        setLoading(false)
      }
    }
    loadProvinces()
    return () => { cancelled = true }
  }, [])

  return { options, loading }
}