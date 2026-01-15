/**
 * Presentation Hook: useApplicationReview
 * Controller for Application Review
 */
import { useState, useCallback, useMemo } from 'react'
import { ReviewApplicationUseCase } from '../../domain/useCases'
import { ApplicationService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useApplicationReview() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)

  const applicationRepo = useMemo(() => new ApplicationService(), [])
  const reviewUseCase = useMemo(
    () => new ReviewApplicationUseCase({ applicationRepository: applicationRepo }),
    [applicationRepo]
  )

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

  const getApplications = useCallback(async ({ filters, pagination } = {}) => {
    setLoading(true)
    try {
      const data = await applicationRepo.getApplications({ filters, pagination })
      return data
    } catch (err) {
      error(err, 'Failed to load applications')
      throw err
    } finally {
      setLoading(false)
    }
  }, [applicationRepo, error])

  return {
    loading,
    reviewApplication,
    getApplications
  }
}
