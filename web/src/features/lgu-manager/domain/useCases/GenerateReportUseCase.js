/**
 * Use Case: Generate Report
 * Business logic for report generation
 * Domain layer - no dependencies
 */
export class GenerateReportUseCase {
  constructor({ reportRepository }) {
    this.reportRepository = reportRepository
  }

  async execute({ type, period, filters }) {
    if (!type) {
      throw new Error('Report type is required')
    }

    if (!period) {
      throw new Error('Report period is required')
    }

    try {
      const report = await this.reportRepository.generate({ type, period, filters })
      return report
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`)
    }
  }
}
