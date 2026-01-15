/**
 * Presentation Hook: useViolations
 * Controller for Violations management
 */
import { useState, useCallback, useMemo } from 'react'
import { IssueViolationUseCase } from '../../domain/useCases'
import { ViolationService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useViolations() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [violations, setViolations] = useState([])

  const violationRepo = useMemo(() => new ViolationService(), [])
  const issueViolationUseCase = useMemo(
    () => new IssueViolationUseCase({ violationRepository: violationRepo }),
    [violationRepo]
  )

  const loadViolations = useCallback(async ({ filters, pagination } = {}) => {
    setLoading(true)
    try {
      const data = await violationRepo.getViolations({ filters, pagination })
      setViolations(data.violations || [])
      return data
    } catch (err) {
      error(err, 'Failed to load violations')
      throw err
    } finally {
      setLoading(false)
    }
  }, [violationRepo, error])

  const issueViolation = useCallback(async ({ inspectionId, businessId, type, severity, description, dueDate }) => {
    setLoading(true)
    try {
      const violation = await issueViolationUseCase.execute({
        inspectionId,
        businessId,
        type,
        severity,
        description,
        dueDate
      })
      success('Violation issued successfully')
      return violation
    } catch (err) {
      error(err, 'Failed to issue violation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [issueViolationUseCase, success, error])

  const updateViolationStatus = useCallback(async ({ violationId, status }) => {
    setLoading(true)
    try {
      const result = await violationRepo.updateStatus({ violationId, status })
      success('Violation status updated successfully')
      return result
    } catch (err) {
      error(err, 'Failed to update violation status')
      throw err
    } finally {
      setLoading(false)
    }
  }, [violationRepo, success, error])

  return {
    loading,
    violations,
    loadViolations,
    issueViolation,
    updateViolationStatus
  }
}
