import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/business'

/**
 * Submit retirement application for a business
 * @param {string} businessId - Business ID
 * @param {object} retirementData - Retirement data
 * @param {string} [retirementData.applicationLetter] - Application letter URL or text
 * @param {number} [retirementData.swornStatementGrossSales] - Sworn statement gross sales
 */
export async function submitRetirement(businessId, retirementData) {
  return post(`${BASE_PATH}/${businessId}/retire`, retirementData)
}

/**
 * Get all retirement applications (for staff)
 * @param {object} params - Query parameters
 * @param {string} [params.status] - Filter by status
 */
export async function getRetirements({ status } = {}) {
  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  const queryString = qs.toString()
  const url = queryString ? `${BASE_PATH}/retirements?${queryString}` : `${BASE_PATH}/retirements`
  return get(url)
}

/**
 * Verify retirement (inspector)
 * @param {string} businessId - Business ID
 * @param {object} verificationData - Verification data
 * @param {boolean} verificationData.verified - Whether business is verified closed
 * @param {string} [verificationData.rejectionReason] - Reason if not verified
 */
export async function verifyRetirement(businessId, verificationData) {
  return post(`${BASE_PATH}/${businessId}/retire/verify`, verificationData)
}

/**
 * Confirm retirement (officer)
 * @param {string} businessId - Business ID
 */
export async function confirmRetirement(businessId) {
  return post(`${BASE_PATH}/${businessId}/retire/confirm`)
}

export const RETIREMENT_STATUSES = {
  requested: 'Requested',
  inspector_verified: 'Inspector Verified',
  confirmed: 'Confirmed',
  rejected: 'Rejected'
}

export function getStatusLabel(status) {
  return RETIREMENT_STATUSES[status] || status || '—'
}

export function getStatusColor(status) {
  const colors = {
    requested: 'yellow',
    inspector_verified: 'blue',
    confirmed: 'green',
    rejected: 'red'
  }
  return colors[status] || 'gray'
}
