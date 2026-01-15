/**
 * Presentation Hook: useAnalytics
 * Controller for Analytics
 */
import { useState, useCallback, useMemo } from 'react'
import { GetAnalyticsUseCase } from '../../domain/useCases'
import { AnalyticsService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useAnalytics() {
  const { error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState(null)

  const analyticsRepo = useMemo(() => new AnalyticsService(), [])
  const getAnalyticsUseCase = useMemo(
    () => new GetAnalyticsUseCase({ analyticsRepository: analyticsRepo }),
    [analyticsRepo]
  )

  const loadAnalytics = useCallback(async ({ period, filters }) => {
    setLoading(true)
    try {
      const data = await getAnalyticsUseCase.execute({ period, filters })
      setAnalytics(data)
      return data
    } catch (err) {
      error(err, 'Failed to load analytics')
      throw err
    } finally {
      setLoading(false)
    }
  }, [getAnalyticsUseCase, error])

  const getDashboardMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const metrics = await analyticsRepo.getDashboardMetrics()
      return metrics
    } catch (err) {
      error(err, 'Failed to load dashboard metrics')
      throw err
    } finally {
      setLoading(false)
    }
  }, [analyticsRepo, error])

  return {
    loading,
    analytics,
    loadAnalytics,
    getDashboardMetrics
  }
}
