import { useState, useEffect, useCallback } from 'react'
import { get } from '@/lib/http.js'

export function usePermitTypes() {
  const [permitTypes, setPermitTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPermitTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await get('/api/admin/permit-forms')
      const data = res?.cards || res?.data?.cards || []
      setPermitTypes(data)
    } catch (err) {
      console.error('Failed to fetch permit types:', err)
      setError(err.message)
      setPermitTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermitTypes()
  }, [fetchPermitTypes])

  return { permitTypes, loading, error, refresh: fetchPermitTypes }
}
