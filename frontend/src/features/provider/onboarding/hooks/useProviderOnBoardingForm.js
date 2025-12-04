import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from "@/features/authentication"
import { authHeaders } from "@/lib/authHeaders.js"
import { getProviderAllowedServices, getProviderOfferings, initializeProviderOfferings, updateProviderOffering as updateOfferingService, completeProviderOnboarding, indexById } from "@/features/provider/services"

export function useProviderOnboardingForm({ onCompleted } = {}) {
  const { success, info, warning, error: notifyError } = useNotifier()
  const { currentUser, role } = useAuthSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [allowedServices, setAllowedServices] = useState([])
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
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

  const initializeSelections = useCallback(async () => {
    if (selectedServiceIds.length === 0) {
      warning('Please select at least one service')
      return
    }
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const created = await initializeProviderOfferings(selectedServiceIds, headers)
      if (Array.isArray(created?.initialized) && created.initialized.length > 0) {
        success('Services initialized. Configure details next.')
      } else {
        info('No new offerings were created. Some may already exist.')
      }
      await loadOfferings()
      setCurrentStep(1)
      setError(null)
    } catch (err) {
      console.error('Initialize offerings error:', err)
      setError(err)
      notifyError(err, 'Failed to initialize services')
    } finally {
      setSubmitting(false)
    }
  }, [selectedServiceIds, loadOfferings, currentUser, role, success, info, warning, notifyError])

  const updateOffering = useCallback(async (id, payload) => {
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const updated = await updateOfferingService(id, payload, headers)
      setOfferings((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
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

  const completeOnboarding = useCallback(async () => {
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const result = await completeProviderOnboarding(headers)
      if (result?.completed) {
        success('Onboarding completed')
        if (typeof onCompleted === 'function') {
          try { await onCompleted() } catch (err) { void err }
        }
        setError(null)
      } else {
        notifyError('Failed to complete onboarding')
      }
    } catch (err) {
      console.error('Complete onboarding error:', err)
      setError(err)
      notifyError(err, 'Failed to complete onboarding')
    } finally {
      setSubmitting(false)
    }
  }, [onCompleted, currentUser, role, success, notifyError])

  return {
    currentStep,
    setCurrentStep,
    isLoading,
    isSubmitting,
    allowedServices,
    selectedServiceIds,
    setSelectedServiceIds,
    initializeSelections,
    offerings,
    serviceMap,
    updateOffering,
    completeOnboarding,
    reload,
    data: offerings,
    error,
  }
}