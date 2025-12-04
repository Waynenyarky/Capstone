import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { notifyProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"
import { fetchWithFallback, fetchJsonWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useReviewProviderApplicationForm(providerId) {
  const { success, error } = useNotifier()
  const [provider, setProvider] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!providerId) return
    setIsLoading(true)
    const res = await fetchWithFallback(`/api/providers/${providerId}`)
    if (!res || !res.ok) {
      error('Failed to load provider details')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    setProvider(data)
    setIsLoading(false)
  }, [providerId, error])

  const updateStatus = useCallback(async (status, extra = null) => {
    if (!providerId) return null
    const payload = { status }
    if (extra && typeof extra === 'object') {
      Object.assign(payload, extra)
    }
    const headers = { 'Content-Type': 'application/json' }
    try {
      const updated = await fetchJsonWithFallback(`/api/providers/${providerId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
      setProvider(updated)
      return updated
    } catch (err) {
      error('Failed to update provider status')
      void err
      return null
    }
  }, [providerId, error])

  const approve = useCallback(async () => {
    setIsApproving(true)
    const updated = await updateStatus('active')
    setIsApproving(false)
    if (updated) {
      success('Provider approved')
      notifyProviderStatusChanged(updated)
    }
    return updated
  }, [updateStatus, success])

  const reject = useCallback(async (rejectionReason) => {
    setIsRejecting(true)
    const updated = await updateStatus('rejected', { rejectionReason })
    setIsRejecting(false)
    if (updated) {
      success('Provider rejected')
      notifyProviderStatusChanged(updated)
    }
    return updated
  }, [updateStatus, success])

  const updateRejectionReason = useCallback(async (rejectionReason) => {
    if (!providerId) return null
    const headers = { 'Content-Type': 'application/json' }
    try {
      const updated = await fetchJsonWithFallback(`/api/providers/${providerId}/rejection-reason`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ rejectionReason }),
      })
      setProvider(updated)
      success('Rejection reason updated')
      notifyProviderStatusChanged(updated)
      return updated
    } catch (err) {
      error('Failed to update rejection reason')
      void err
      return null
    }
  }, [providerId, success, error])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return {
    provider,
    isLoading,
    isApproving,
    isRejecting,
    approve,
    reject,
    updateRejectionReason,
    reload: fetchDetail,
  }
}