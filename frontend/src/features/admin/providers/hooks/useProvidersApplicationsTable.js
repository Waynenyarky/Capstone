import { useCallback, useEffect, useState } from 'react'
import { subscribeProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useProvidersApplicationsTable(status = 'pending') {
  const { error } = useNotifier()
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadApplications = useCallback(async () => {
    setIsLoading(true)
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetchWithFallback(`/api/providers${qs}`)
    if (!res || !res.ok) {
      error('Failed to load provider applications')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    setApplications(Array.isArray(data) ? data : [])
    setIsLoading(false)
  }, [status, error])

  useEffect(() => {
    reloadApplications()
  }, [reloadApplications])

  // Auto-reload when any provider status changes
  useEffect(() => {
    const unsubscribe = subscribeProviderStatusChanged(() => {
      reloadApplications()
    })
    return unsubscribe
  }, [reloadApplications])

  return { applications, isLoading, reloadApplications, setApplications }
}