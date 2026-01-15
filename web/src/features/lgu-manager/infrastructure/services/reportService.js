/**
 * Infrastructure Service: ReportService
 * Implements ReportRepository interface
 * Handles API calls for reports
 */
import { ReportRepository } from '../../application/repositories/ReportRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class ReportService extends ReportRepository {
  async generate({ type, period, filters }) {
    const response = await fetchJsonWithFallback('/api/lgu-manager/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, period, filters })
    })
    return response
  }

  async getReports({ filters, pagination }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-manager/reports?${params}`)
    return response
  }

  async getReportById(id) {
    const response = await fetchJsonWithFallback(`/api/lgu-manager/reports/${id}`)
    return response
  }
}
