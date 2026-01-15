/**
 * Presentation Hook: useReports
 * Controller for Reports management
 */
import { useState, useCallback, useMemo } from 'react'
import { GenerateReportUseCase } from '../../domain/useCases'
import { ReportService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useReports() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])

  const reportRepo = useMemo(() => new ReportService(), [])
  const generateReportUseCase = useMemo(
    () => new GenerateReportUseCase({ reportRepository: reportRepo }),
    [reportRepo]
  )

  const loadReports = useCallback(async ({ filters, pagination } = {}) => {
    setLoading(true)
    try {
      const data = await reportRepo.getReports({ filters, pagination })
      setReports(data.reports || [])
      return data
    } catch (err) {
      error(err, 'Failed to load reports')
      throw err
    } finally {
      setLoading(false)
    }
  }, [reportRepo, error])

  const generateReport = useCallback(async ({ type, period, filters }) => {
    setLoading(true)
    try {
      const report = await generateReportUseCase.execute({ type, period, filters })
      success('Report generated successfully')
      return report
    } catch (err) {
      error(err, 'Failed to generate report')
      throw err
    } finally {
      setLoading(false)
    }
  }, [generateReportUseCase, success, error])

  return {
    loading,
    reports,
    loadReports,
    generateReport
  }
}
