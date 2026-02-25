import { get, post, put } from '@/lib/http.js'

const BASE_PATH = '/api/business/edit-requests'

/**
 * Get edit requests for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 */
export async function getEditRequests({ page = 1, limit = 20 } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))

  return get(`${BASE_PATH}?${qs.toString()}`)
}

/**
 * Submit a new edit request
 * @param {object} requestData - Edit request data
 * @param {string} requestData.businessId - Business ID
 * @param {string} requestData.fieldName - Field to edit
 * @param {string} [requestData.currentValue] - Current value
 * @param {string} requestData.requestedValue - Requested new value
 * @param {string} [requestData.reason] - Reason for change
 * @param {string[]} [requestData.supportingDocuments] - Supporting document URLs
 */
export async function submitEditRequest(requestData) {
  return post(BASE_PATH, requestData)
}

/**
 * Update an edit request (for staff to approve/reject)
 * @param {string} requestId - Edit request ID
 * @param {object} updateData - Update data
 * @param {string} updateData.status - New status (approved, rejected)
 * @param {string} [updateData.reviewNotes] - Review notes
 */
export async function updateEditRequest(requestId, updateData) {
  return put(`${BASE_PATH}/${requestId}`, updateData)
}

export const EDITABLE_FIELDS = [
  'address',
  'tradeName',
  'businessActivities',
  'capital',
  'contact',
  'businessName',
  'registeredBusinessName',
  'phoneNumber',
  'email'
]

export const FIELD_LABELS = {
  address: 'Business Address',
  tradeName: 'Trade Name',
  businessActivities: 'Business Activities',
  capital: 'Capital',
  contact: 'Contact Information',
  businessName: 'Business Name',
  registeredBusinessName: 'Registered Business Name',
  phoneNumber: 'Phone Number',
  email: 'Email Address'
}

export const EDIT_REQUEST_STATUSES = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

export function getFieldLabel(fieldName) {
  return FIELD_LABELS[fieldName] || fieldName || '—'
}

export function getStatusLabel(status) {
  return EDIT_REQUEST_STATUSES[status] || status || '—'
}
