/**
 * Infrastructure Service: ViolationService
 * Implements ViolationRepository interface
 * Handles API calls for violations
 */
import { ViolationRepository } from '../../application/repositories/ViolationRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class ViolationService extends ViolationRepository {
  async create({ inspectionId, businessId, type, severity, description, dueDate, status, issuedDate }) {
    const response = await fetchJsonWithFallback('/api/lgu-officer/violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionId, businessId, type, severity, description, dueDate, status, issuedDate })
    })
    return response
  }

  async getViolations({ filters, pagination }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-officer/violations?${params}`)
    return response
  }

  async getViolationById(id) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/violations/${id}`)
    return response
  }

  async updateStatus({ violationId, status }) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/violations/${violationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    return response
  }
}
