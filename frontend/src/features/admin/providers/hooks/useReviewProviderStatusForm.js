import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { notifyProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"
import { fetchWithFallback, fetchJsonWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useReviewProviderStatusForm(providerId) {
  const { success, error } = useNotifier()
  const [provider, setProvider] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const updateStatus = useCallback(async (status, reason = '') => {
    if (!providerId) return null
    const payload = { status }
    // Only send rejectionReason when status is rejected; backend supports it explicitly
    if (String(status) === 'rejected' && typeof reason === 'string' && reason.trim()) {
      payload.rejectionReason = reason.trim()
    } else if (typeof reason === 'string' && reason.trim()) {
      payload.statusChangeReason = reason.trim()
    }
    const headers = { 'Content-Type': 'application/json' }
    try {
      setIsSaving(true)
      const updated = await fetchJsonWithFallback(`/api/providers/${providerId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
      setProvider(updated)
      setIsSaving(false)
      success('Provider status updated')
      notifyProviderStatusChanged(updated)
      return updated
    } catch (err) {
      setIsSaving(false)
      error('Failed to update provider status')
      void err
      return null
    }
  }, [providerId, success, error])

  const resolveAppeal = useCallback(async (appealId, decision, decisionNotes = '') => {
    if (!providerId || !appealId) return null
    const headers = { 'Content-Type': 'application/json' }
    try {
      setIsSaving(true)
      const updated = await fetchJsonWithFallback(`/api/providers/${providerId}/appeals/${appealId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ decision, decisionNotes }),
      })
      setProvider((prev) => ({ ...(prev || {}), ...updated }))
      setIsSaving(false)
      notifyProviderStatusChanged(updated)
      return updated
    } catch (err) {
      setIsSaving(false)
      error('Failed to resolve appeal')
      void err
      return null
    }
  }, [providerId, error])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return {
    provider,
    isLoading,
    isSaving,
    reload: fetchDetail,
    updateStatus,
    resolveAppeal,
  }
}