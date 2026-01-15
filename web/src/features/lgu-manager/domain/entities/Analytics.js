/**
 * Domain Entity: Analytics
 * Pure business logic entity - no dependencies
 */
export class Analytics {
  constructor({ metrics, period, filters }) {
    this.metrics = metrics || {}
    this.period = period
    this.filters = filters || {}
  }

  calculateTrend(current, previous) {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  isValid() {
    return this.period && Object.keys(this.metrics).length > 0
  }
}
