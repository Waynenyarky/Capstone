/**
 * Presentation Hook: useLGUManagerDashboard
 * Controller for LGU Manager Dashboard
 * Connects UI to use cases
 */
import { useState, useEffect, useMemo } from 'react'
import { GenerateReportUseCase, GetAnalyticsUseCase } from '../../domain/useCases'
import { ReportService, AnalyticsService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useLGUManagerDashboard() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)

  // Initialize repositories and use cases
  const reportRepo = useMemo(() => new ReportService(), [])
  const analyticsRepo = useMemo(() => new AnalyticsService(), [])
  
  const generateReportUseCase = useMemo(
    () => new GenerateReportUseCase({ reportRepository: reportRepo }),
    [reportRepo]
  )
  
  const getAnalyticsUseCase = useMemo(
    () => new GetAnalyticsUseCase({ analyticsRepository: analyticsRepo }),
    [analyticsRepo]
  )

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const metrics = await analyticsRepo.getDashboardMetrics()
        setDashboardData(metrics)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [analyticsRepo, error])

  const generateReport = async ({ type, period, filters }) => {
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
  }

  const getAnalytics = async ({ period, filters }) => {
    setLoading(true)
    try {
      const analytics = await getAnalyticsUseCase.execute({ period, filters })
      return analytics
    } catch (err) {
      error(err, 'Failed to get analytics')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    dashboardData,
    generateReport,
    getAnalytics
  }
}
