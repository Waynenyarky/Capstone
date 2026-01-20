/**
 * Infrastructure Service: PermitApplicationService
 * Implements PermitApplicationRepository interface
 * Handles API calls for permit applications
 */
import { PermitApplicationRepository } from '../../application/repositories/PermitApplicationRepository'
import { fetchJsonWithFallback } from '@/lib/http.js'

export class PermitApplicationService extends PermitApplicationRepository {
  /**
   * Start reviewing an application (set status to under_review)
   * @param {object} params - Start review parameters
   * @param {string} params.applicationId - Application ID
   * @param {string} params.businessId - Business ID (optional)
   * @returns {Promise<object>} Updated application
   */
  async startReview({ applicationId, businessId }) {
    if (!applicationId) {
      throw new Error('Application ID is required')
    }

    console.log(`[PermitApplicationService] Starting review for applicationId=${applicationId}, businessId=${businessId || 'N/A'}`)
    
    try {
      const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications/${applicationId}/start-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })
      
      console.log(`[PermitApplicationService] Review started successfully for applicationId=${applicationId}, status=${response?.application?.status || 'N/A'}`)
      return response
    } catch (error) {
      console.error(`[PermitApplicationService] Failed to start review for applicationId=${applicationId}:`, error)
      throw error
    }
  }

  /**
   * Review a permit application
   * @param {object} params - Review parameters
   * @param {string} params.applicationId - Application ID
   * @param {string} params.decision - Decision: 'approve', 'reject', 'request_changes'
   * @param {string} params.comments - Review comments (required)
   * @param {string} params.rejectionReason - Rejection reason (required if decision is 'reject')
   * @param {string} params.businessId - Business ID (optional)
   * @returns {Promise<object>} Review result
   */
  async review({ applicationId, decision, comments, rejectionReason, businessId }) {
    if (!applicationId) {
      throw new Error('Application ID is required')
    }
    if (!decision) {
      throw new Error('Decision is required')
    }
    if (!comments) {
      throw new Error('Comments are required')
    }
    if (decision === 'reject' && !rejectionReason) {
      throw new Error('Rejection reason is required when rejecting an application')
    }

    const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications/${applicationId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        decision, 
        comments, 
        rejectionReason,
        businessId 
      })
    })
    return response
  }

  /**
   * Get permit applications with filters and pagination
   * @param {object} params - Query parameters
   * @param {object} params.filters - Filter criteria
   * @param {object} params.pagination - Pagination options
   * @returns {Promise<object>} Applications list with pagination
   */
  async getApplications({ filters = {}, pagination = {} }) {
    const params = new URLSearchParams()
    
    // Add filters
    if (filters.status) params.append('status', filters.status)
    if (filters.businessName) params.append('businessName', filters.businessName)
    if (filters.applicationType) params.append('applicationType', filters.applicationType)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.applicationReferenceNumber) params.append('applicationReferenceNumber', filters.applicationReferenceNumber)
    
    // Add pagination
    params.append('page', pagination.page || 1)
    params.append('limit', pagination.limit || 10)

    const response = await fetchJsonWithFallback(`/api/lgu-officer/permit-applications?${params}`)
    return response
  }

  /**
   * Get single application by ID
   * @param {string} id - Application ID
   * @param {string} businessId - Business ID (optional)
   * @returns {Promise<object>} Application details
   */
  async getApplicationById(id, businessId = null) {
    if (!id) {
      throw new Error('Application ID is required')
    }

    const params = new URLSearchParams()
    if (businessId) params.append('businessId', businessId)

    const url = `/api/lgu-officer/permit-applications/${id}${params.toString() ? `?${params}` : ''}`
    const response = await fetchJsonWithFallback(url)
    return response
  }

  /**
   * Get pending applications
   * @param {object} params - Query parameters
   * @param {string} params.status - Status filter (default: 'submitted')
   * @param {object} params.pagination - Pagination options
   * @returns {Promise<object>} Pending applications list
   */
  async getPendingApplications({ status, pagination = {} } = {}) {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (pagination.page) params.append('page', pagination.page)
    if (pagination.limit) params.append('limit', pagination.limit)

    const url = `/api/lgu-officer/permit-applications/pending${params.toString() ? `?${params}` : ''}`
    const response = await fetchJsonWithFallback(url)
    return response
  }
}
