import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useServiceTable() {
  const { error } = useNotifier()
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadServices = useCallback(async () => {
    setIsLoading(true)
    const res = await fetchWithFallback('/api/services')
    if (!res || !res.ok) {
      error('Failed to load services')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    setServices(Array.isArray(data) ? data : [])
    setIsLoading(false)
  }, [error])

  useEffect(() => {
    reloadServices()
  }, [reloadServices])

  return { services, isLoading, reloadServices, setServices }
}