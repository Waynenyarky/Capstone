/**
 * Infrastructure Service: PermitApplicationService
 * Implements PermitApplicationRepository interface
 * Handles API calls for permit applications
 */
import { PermitApplicationRepository } from '../../application/repositories/PermitApplicationRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class PermitApplicationService extends PermitApplicationRepository {
  async review({ applicationId, decision, comments, reviewedDate }) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications/${applicationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments, reviewedDate })
    })
    return response
  }

  async getApplications({ filters, pagination }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications?${params}`)
    return response
  }

  async getApplicationById(id) {
    const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications/${id}`)
    return response
  }

  async getPendingApplications() {
    const response = await fetchJsonWithFallback('/api/lgu-officer/permit-applications/pending')
    return response
  }
}
