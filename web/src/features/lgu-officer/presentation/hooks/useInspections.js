/**
 * Presentation Hook: useInspections
 * Controller for Inspections management
 */
import { useState, useCallback, useMemo } from 'react'
import { ConductInspectionUseCase, UpdateInspectionStatusUseCase } from '../../domain/useCases'
import { InspectionService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useInspections() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [inspections, setInspections] = useState([])

  const inspectionRepo = useMemo(() => new InspectionService(), [])
  
  const conductInspectionUseCase = useMemo(
    () => new ConductInspectionUseCase({ inspectionRepository: inspectionRepo }),
    [inspectionRepo]
  )

  const updateStatusUseCase = useMemo(
    () => new UpdateInspectionStatusUseCase({ inspectionRepository: inspectionRepo }),
    [inspectionRepo]
  )

  const loadInspections = useCallback(async ({ filters, pagination } = {}) => {
    setLoading(true)
    try {
      const data = await inspectionRepo.getInspections({ filters, pagination })
      setInspections(data.inspections || [])
      return data
    } catch (err) {
      error(err, 'Failed to load inspections')
      throw err
    } finally {
      setLoading(false)
    }
  }, [inspectionRepo, error])

  const conductInspection = useCallback(async ({ inspectionId, findings, notes, conductedDate }) => {
    setLoading(true)
    try {
      const inspection = await conductInspectionUseCase.execute({ inspectionId, findings, notes, conductedDate })
      success('Inspection conducted successfully')
      return inspection
    } catch (err) {
      error(err, 'Failed to conduct inspection')
      throw err
    } finally {
      setLoading(false)
    }
  }, [conductInspectionUseCase, success, error])

  const updateStatus = useCallback(async ({ inspectionId, status, notes }) => {
    setLoading(true)
    try {
      const inspection = await updateStatusUseCase.execute({ inspectionId, status, notes })
      success('Inspection status updated successfully')
      return inspection
    } catch (err) {
      error(err, 'Failed to update inspection status')
      throw err
    } finally {
      setLoading(false)
    }
  }, [updateStatusUseCase, success, error])

  return {
    loading,
    inspections,
    loadInspections,
    conductInspection,
    updateStatus
  }
}
