/**
 * Repository Interface: ReportRepository
 * Defines contract for report data access
 * Implemented by infrastructure layer
 */
export class ReportRepository {
  async generate({ type, period, filters }) {
    throw new Error('generate method must be implemented')
  }

  async getReports({ filters, pagination }) {
    throw new Error('getReports method must be implemented')
  }

  async getReportById(id) {
    throw new Error('getReportById method must be implemented')
  }
}
