/**
 * Infrastructure Service: ApplicationService
 * Implements ApplicationRepository interface
 * Handles API calls for applications
 */
import { ApplicationRepository } from '../../application/repositories/ApplicationRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class ApplicationService extends ApplicationRepository {
  async review({ applicationId, decision, comments }) {
    const response = await fetchJsonWithFallback(`/api/lgu-manager/applications/${applicationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments })
    })
    return response
  }

  async getApplications({ filters, pagination }) {
    const params = new URLSearchParams({
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10
    })
    const response = await fetchJsonWithFallback(`/api/lgu-manager/applications?${params}`)
    return response
  }

  async getApplicationById(id) {
    const response = await fetchJsonWithFallback(`/api/lgu-manager/applications/${id}`)
    return response
  }
}
