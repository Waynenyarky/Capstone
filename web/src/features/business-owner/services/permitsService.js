import { get, post, put } from '@/lib/http.js'

const GENERAL_PATH = '/api/business/general-permits'
const OCCUPATIONAL_PATH = '/api/business/occupational-permits'

/**
 * Get general permits for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status
 */
export async function getGeneralPermits({ page = 1, limit = 20, status } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)

  return get(`${GENERAL_PATH}?${qs.toString()}`)
}

/**
 * Create a general permit application
 * @param {object} permitData - Permit data
 * @param {string} permitData.permitCategory - Permit category
 * @param {object[]} permitData.requirements - Requirements/documents
 * @param {string} [permitData.businessPlateNo] - Business plate number
 */
export async function createGeneralPermit(permitData) {
  return post(GENERAL_PATH, permitData)
}

/**
 * Update a general permit (for staff)
 * @param {string} permitId - Permit ID
 * @param {object} updateData - Update data
 * @param {string} updateData.status - New status
 */
export async function updateGeneralPermit(permitId, updateData) {
  return put(`${GENERAL_PATH}/${permitId}`, updateData)
}

/**
 * Get occupational permits for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 */
export async function getOccupationalPermits({ page = 1, limit = 20 } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))

  return get(`${OCCUPATIONAL_PATH}?${qs.toString()}`)
}

/**
 * Create an occupational permit application
 * @param {object} permitData - Permit data
 * @param {string} permitData.firstName - First name
 * @param {string} permitData.lastName - Last name
 * @param {string} permitData.businessPlateNo - Business plate number
 * @param {string} [permitData.gender] - Gender
 * @param {string} [permitData.civilStatus] - Civil status
 * @param {Date} [permitData.dateOfBirth] - Date of birth
 * @param {string} [permitData.address] - Address
 * @param {string} [permitData.education] - Education
 * @param {string} [permitData.employer] - Employer
 * @param {string} [permitData.company] - Company
 * @param {string} [permitData.position] - Position
 * @param {string} [permitData.type] - Type (employed, self_employed)
 */
export async function createOccupationalPermit(permitData) {
  return post(OCCUPATIONAL_PATH, permitData)
}

/**
 * Update an occupational permit (for staff)
 * @param {string} permitId - Permit ID
 * @param {object} updateData - Update data
 * @param {string} [updateData.status] - New status
 * @param {object} [updateData.labExams] - Lab exam results
 */
export async function updateOccupationalPermit(permitId, updateData) {
  return put(`${OCCUPATIONAL_PATH}/${permitId}`, updateData)
}

export const PERMIT_STATUSES = {
  submitted: 'Submitted',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

export function getPermitStatusLabel(status) {
  return PERMIT_STATUSES[status] || status || '—'
}
