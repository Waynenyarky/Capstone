/**
 * Infrastructure Service: InspectionService
 * Implements InspectionRepository interface
 * Handles API calls for inspections
 */
import { InspectionRepository } from '../../application/repositories/InspectionRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class InspectionService extends InspectionRepository {
  async conduct({ inspectionId, findings, notes, conductedDate }) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections/${inspectionId}/conduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findings, notes, conductedDate })
    })
    return response
  }

  async getInspections({ filters, pagination }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections?${params}`)
    return response
  }

  async getInspectionById(id) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections/${id}`)
    return response
  }

  async updateStatus({ inspectionId, status, notes }) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections/${inspectionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    })
    return response
  }

  async schedule({ businessId, type, scheduledDate, inspectorId }) {
    const response = await fetchJsonWithFallback('/api/lgu-officer/inspections/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, type, scheduledDate, inspectorId })
    })
    return response
  }
}
