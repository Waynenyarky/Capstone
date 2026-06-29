/**
 * Infrastructure Service: InspectionService
 * Handles API calls for inspections
 */
import { fetchJsonWithFallback } from '@/lib/http.js'

export class InspectionService {
  async conduct({ inspectionId, findings, notes, conductedDate }) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections/${inspectionId}/conduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findings, notes, conductedDate })
    })
    return response
  }

  async getInspections({ filters, pagination, options = {} }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-officer/inspections?${params}`, options)
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
