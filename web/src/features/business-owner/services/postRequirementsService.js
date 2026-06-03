import { get, put } from '@/lib/http.js'

const BASE_PATH = '/api/business/post-requirements'

/**
 * Get post-requirements for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.businessId] - Filter by business ID
 */
export async function getPostRequirements({ page = 1, limit = 20, status, businessId } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  if (businessId) qs.set('businessId', businessId)

  return get(`${BASE_PATH}?${qs.toString()}`)
}

/**
 * Submit compliance for a post-requirement
 * @param {string} requirementId - Post-requirement ID
 * @param {object} complianceData - Compliance data
 * @param {string[]} complianceData.submittedDocuments - Document URLs
 */
export async function submitCompliance(requirementId, complianceData) {
  return put(`${BASE_PATH}/${requirementId}`, {
    status: 'submitted',
    submittedDocuments: complianceData.submittedDocuments
  })
}

/**
 * Request extension for a post-requirement (staff only)
 * @param {string} requirementId - Post-requirement ID
 * @param {object} extensionData - Extension data
 * @param {string} extensionData.newDueDate - New due date
 * @param {string} [extensionData.reason] - Reason for extension
 */
export async function requestExtension(requirementId, extensionData) {
  return put(`${BASE_PATH}/${requirementId}/extend`, extensionData)
}

export const POST_REQUIREMENT_STATUSES = {
  pending: 'Pending',
  submitted: 'Submitted',
  verified: 'Verified',
  non_compliant: 'Non-Compliant',
  overdue: 'Overdue'
}

export function getStatusLabel(status) {
  return POST_REQUIREMENT_STATUSES[status] || status || '—'
}

export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    submitted: 'blue',
    verified: 'green',
    non_compliant: 'red',
    overdue: 'red'
  }
  return colors[status] || 'gray'
}
