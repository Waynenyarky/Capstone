/**
 * Use Case: Get Analytics
 * Business logic for analytics retrieval
 * Domain layer - no dependencies
 */
export class GetAnalyticsUseCase {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository
  }

  async execute({ period, filters }) {
    if (!period) {
      throw new Error('Analytics period is required')
    }

    try {
      const analytics = await this.analyticsRepository.getAnalytics({ period, filters })
      return analytics
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`)
    }
  }
}
