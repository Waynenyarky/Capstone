import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { subscribeProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useProvidersTable(status = 'active') {
  const { error } = useNotifier()
  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadProviders = useCallback(async () => {
    setIsLoading(true)
    let qs = ''
    if (status) {
      if (status === 'appeals') {
        qs = '?appeals=pending'
      } else {
        qs = `?status=${encodeURIComponent(status)}`
      }
    }
    const res = await fetchWithFallback(`/api/providers${qs}`)
    if (!res || !res.ok) {
      error('Failed to load providers')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    setProviders(Array.isArray(data) ? data : [])
    setIsLoading(false)
  }, [status, error])

  useEffect(() => {
    reloadProviders()
  }, [reloadProviders])

  // Auto-reload when any provider status changes
  useEffect(() => {
    const unsubscribe = subscribeProviderStatusChanged(() => {
      reloadProviders()
    })
    return unsubscribe
  }, [reloadProviders])

  return { providers, isLoading, reloadProviders, setProviders }
}