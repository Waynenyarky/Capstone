/**
 * Presentation Hook: usePermitApplications
 * Controller for Permit Applications
 */
import { useState, useCallback, useMemo } from 'react'
import { ReviewPermitApplicationUseCase } from '../../domain/useCases'
import { PermitApplicationService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function usePermitApplications() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])

  const permitAppRepo = useMemo(() => new PermitApplicationService(), [])
  const reviewUseCase = useMemo(
    () => new ReviewPermitApplicationUseCase({ permitApplicationRepository: permitAppRepo }),
    [permitAppRepo]
  )

  const loadApplications = useCallback(async ({ filters, pagination } = {}) => {
    setLoading(true)
    try {
      const data = await permitAppRepo.getApplications({ filters, pagination })
      setApplications(data.applications || [])
      return data
    } catch (err) {
      error(err, 'Failed to load permit applications')
      throw err
    } finally {
      setLoading(false)
    }
  }, [permitAppRepo, error])

  const reviewApplication = useCallback(async ({ applicationId, decision, comments }) => {
    setLoading(true)
    try {
      const result = await reviewUseCase.execute({ applicationId, decision, comments })
      success(`Application ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent for revision'} successfully`)
      return result
    } catch (err) {
      error(err, 'Failed to review application')
      throw err
    } finally {
      setLoading(false)
    }
  }, [reviewUseCase, success, error])

  const loadPendingApplications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await permitAppRepo.getPendingApplications()
      setApplications(data.applications || [])
      return data
    } catch (err) {
      error(err, 'Failed to load pending applications')
      throw err
    } finally {
      setLoading(false)
    }
  }, [permitAppRepo, error])

  return {
    loading,
    applications,
    loadApplications,
    reviewApplication,
    loadPendingApplications
  }
}
