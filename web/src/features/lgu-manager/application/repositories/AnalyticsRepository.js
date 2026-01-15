/**
 * Repository Interface: AnalyticsRepository
 * Defines contract for analytics data access
 * Implemented by infrastructure layer
 */
export class AnalyticsRepository {
  async getAnalytics({ period, filters }) {
    throw new Error('getAnalytics method must be implemented')
  }

  async getDashboardMetrics() {
    throw new Error('getDashboardMetrics method must be implemented')
  }

  async getTrends({ metric, period }) {
    throw new Error('getTrends method must be implemented')
  }
}
