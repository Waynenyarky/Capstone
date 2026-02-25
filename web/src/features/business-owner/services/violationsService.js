import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/business/violations'

/**
 * Get violations for the current user's businesses
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status (open, resolved, appealed)
 * @param {string} [params.severity] - Filter by severity (minor, major, critical)
 * @param {string} [params.businessId] - Filter by business ID
 */
export async function getViolations({ page = 1, limit = 20, status, severity, businessId } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  if (severity) qs.set('severity', severity)
  if (businessId) qs.set('businessId', businessId)

  return get(`${BASE_PATH}?${qs.toString()}`)
}

/**
 * Get open violations requiring action
 * @param {object} params - Query parameters
 * @param {number} [params.limit=20] - Max items to return
 */
export async function getOpenViolations({ limit = 20 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', String(limit))

  return get(`${BASE_PATH}/open?${qs.toString()}`)
}

/**
 * Get violation summary/counts for dashboard
 */
export async function getViolationSummary() {
  return get(`${BASE_PATH}/summary`)
}

/**
 * Get violation details
 * @param {string} violationId - Violation ID (e.g., VIO-2024-001)
 */
export async function getViolation(violationId) {
  return get(`${BASE_PATH}/${violationId}`)
}

/**
 * Acknowledge receipt of violation notice
 * @param {string} violationId - Violation ID
 */
export async function acknowledgeViolation(violationId) {
  return post(`${BASE_PATH}/${violationId}/acknowledge`)
}

export const VIOLATION_STATUSES = {
  open: 'Open',
  resolved: 'Resolved',
  appealed: 'Appealed'
}

export const VIOLATION_SEVERITIES = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical'
}

export function getStatusLabel(status) {
  return VIOLATION_STATUSES[status] || status || '—'
}

export function getSeverityLabel(severity) {
  return VIOLATION_SEVERITIES[severity] || severity || '—'
}

export function getStatusColor(status) {
  const colors = {
    open: 'red',
    resolved: 'green',
    appealed: 'yellow'
  }
  return colors[status] || 'gray'
}

export function getSeverityColor(severity) {
  const colors = {
    minor: 'yellow',
    major: 'orange',
    critical: 'red'
  }
  return colors[severity] || 'gray'
}
