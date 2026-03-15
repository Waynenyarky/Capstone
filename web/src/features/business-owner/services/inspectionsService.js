import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/business/inspections'

function normalizeInspection(item = {}) {
  const id = item._id || item.id || item.inspectionId || null
  const inspectorName = item.inspectorName || item.inspector || item.inspector?.name || null
  const acknowledged = Boolean(item.ownerAcknowledgment?.acknowledged)
  const acknowledgedAt = item.ownerAcknowledgment?.timestamp || item.acknowledgedAt || null
  return {
    ...item,
    _id: id,
    id,
    inspectionId: item.inspectionId || id,
    result: item.result || item.overallResult || null,
    overallResult: item.overallResult || item.result || null,
    inspectorName,
    ownerAcknowledged: acknowledged,
    acknowledgedAt,
  }
}

function normalizeInspectionListResponse(res = {}) {
  const rawItems = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.inspections)
        ? res.inspections
        : []
  const inspections = rawItems.map(normalizeInspection)
  const meta = res?.meta || res?.pagination || {}
  return {
    inspections,
    data: inspections,
    meta,
    pagination: meta,
  }
}

/**
 * Get inspections for the current user's businesses
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status (pending, in_progress, completed)
 * @param {string} [params.businessId] - Filter by business ID
 * @param {string} [params.dateFrom] - Filter from date (YYYY-MM-DD)
 * @param {string} [params.dateTo] - Filter to date (YYYY-MM-DD)
 */
export async function getInspections({ page = 1, limit = 20, status, businessId, dateFrom, dateTo } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  if (businessId) qs.set('businessId', businessId)
  if (dateFrom) qs.set('dateFrom', dateFrom)
  if (dateTo) qs.set('dateTo', dateTo)

  const res = await get(`${BASE_PATH}?${qs.toString()}`)
  return normalizeInspectionListResponse(res)
}

/**
 * Get upcoming scheduled inspections
 * @param {object} params - Query parameters
 * @param {number} [params.limit=10] - Max items to return
 */
export async function getUpcomingInspections({ limit = 10 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', String(limit))

  const res = await get(`${BASE_PATH}/upcoming?${qs.toString()}`)
  const normalized = normalizeInspectionListResponse(res)
  return {
    ...normalized,
    upcoming: normalized.inspections,
  }
}

/**
 * Get inspection details
 * @param {string} inspectionId - Inspection ID
 */
export async function getInspection(inspectionId) {
  const res = await get(`${BASE_PATH}/${inspectionId}`)
  const payload = res?.data || res
  return normalizeInspection(payload)
}

/**
 * Get violations from a specific inspection
 * @param {string} inspectionId - Inspection ID
 */
export async function getInspectionViolations(inspectionId) {
  const res = await get(`${BASE_PATH}/${inspectionId}/violations`)
  const violations = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.violations)
        ? res.violations
        : []
  return {
    violations,
    data: violations,
  }
}

/**
 * Acknowledge inspection results
 * @param {string} inspectionId - Inspection ID
 */
export async function acknowledgeInspection(inspectionId) {
  return post(`${BASE_PATH}/${inspectionId}/acknowledge`)
}

export const INSPECTION_STATUSES = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed'
}

export const INSPECTION_TYPES = {
  initial: 'Initial',
  renewal: 'Renewal',
  follow_up: 'Follow-up',
  joint: 'Joint',
  compliance: 'Compliance',
  complaint: 'Complaint'
}

export const INSPECTION_RESULTS = {
  passed: 'Passed',
  failed: 'Failed',
  needs_reinspection: 'Needs Re-inspection'
}

export function getStatusLabel(status) {
  return INSPECTION_STATUSES[status] || status || '—'
}

export function getTypeLabel(type) {
  return INSPECTION_TYPES[type] || type || '—'
}

export function getResultLabel(result) {
  return INSPECTION_RESULTS[result] || result || '—'
}

export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    in_progress: 'blue',
    completed: 'green'
  }
  return colors[status] || 'gray'
}

export function getResultColor(result) {
  const colors = {
    passed: 'green',
    failed: 'red',
    needs_reinspection: 'yellow'
  }
  return colors[result] || 'gray'
}
