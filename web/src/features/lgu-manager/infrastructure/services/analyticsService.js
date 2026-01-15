/**
 * Infrastructure Service: AnalyticsService
 * Implements AnalyticsRepository interface
 * Handles API calls for analytics
 */
import { AnalyticsRepository } from '../../application/repositories/AnalyticsRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class AnalyticsService extends AnalyticsRepository {
  async getAnalytics({ period, filters }) {
    const params = new URLSearchParams({ period, ...filters })
    const response = await fetchJsonWithFallback(`/api/lgu-manager/analytics?${params}`)
    return response
  }

  async getDashboardMetrics() {
    const response = await fetchJsonWithFallback('/api/lgu-manager/analytics/dashboard')
    return response
  }

  async getTrends({ metric, period }) {
    const params = new URLSearchParams({ metric, period })
    const response = await fetchJsonWithFallback(`/api/lgu-manager/analytics/trends?${params}`)
    return response
  }
}
