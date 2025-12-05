import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from "@/features/authentication"
import { authHeaders } from "@/lib/authHeaders.js"
import { getProviderAllowedServices, getProviderOfferings, initializeProviderOfferings, updateProviderOffering as updateOfferingService, indexById } from "@/features/provider/services"

export function useProviderOfferings() {
  const { success, info, warning, error: notifyError } = useNotifier()
  const { currentUser, role } = useAuthSession()
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [allowedServices, setAllowedServices] = useState([])
  const [offerings, setOfferings] = useState([])
  const [error, setError] = useState(null)


  const loadAllowedServices = useCallback(async () => {
    const headers = authHeaders(currentUser, role)
    const data = await getProviderAllowedServices(headers)
    setAllowedServices(Array.isArray(data) ? data : [])
  }, [currentUser, role])

  const loadOfferings = useCallback(async () => {
    const headers = authHeaders(currentUser, role)
    const data = await getProviderOfferings(headers)
    setOfferings(Array.isArray(data) ? data : [])
  }, [currentUser, role])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadAllowedServices(), loadOfferings()])
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [loadAllowedServices, loadOfferings])

  useEffect(() => {
    reload()
  }, [reload])

  const serviceMap = useMemo(() => indexById(allowedServices), [allowedServices])

  const initializeOfferings = useCallback(async (serviceIds) => {
    const ids = Array.isArray(serviceIds) ? serviceIds.filter(Boolean).map(String) : []
    if (ids.length === 0) {
      warning('Please select at least one service')
      return { initialized: [] }
    }
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const created = await initializeProviderOfferings(ids, headers)
      if (Array.isArray(created?.initialized) && created.initialized.length > 0) {
        success('Services initialized')
      } else {
        info('No new offerings were created. Some may already exist.')
      }
      await loadOfferings()
      setError(null)
      return { initialized: Array.isArray(created?.initialized) ? created.initialized : [] }
    } catch (err) {
      console.error('Initialize offerings error:', err)
      setError(err)
      notifyError(err, 'Failed to initialize services')
      return { initialized: [] }
    } finally {
      setSubmitting(false)
    }
  }, [loadOfferings, currentUser, role, success, info, warning, notifyError])

  const updateOffering = useCallback(async (id, payload) => {
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const updated = await updateOfferingService(id, payload, headers)
      setOfferings((prev) => prev.map((o) => (String(o.id) === String(updated.id) ? updated : o)))
      setError(null)
      return true
    } catch (err) {
      console.error('Update offering error:', err)
      setError(err)
      notifyError(err, 'Failed to save offering')
      return false
    } finally {
      setSubmitting(false)
    }
  }, [currentUser, role, notifyError])

  return {
    isLoading,
    isSubmitting,
    allowedServices,
    offerings,
    serviceMap,
    reload,
    initializeOfferings,
    updateOffering,
    data: offerings,
    error,
  }
}