/**
 * Service for LGU Manager inspection assignment
 */
import { post, get, put } from '@/lib/http.js'

export async function getInspectors() {
  const res = await get('/api/lgu-officer/inspectors')
  return res?.inspectors ?? []
}

export async function getBusinessesForInspection() {
  const res = await get('/api/lgu-officer/businesses-for-inspection')
  return res?.businesses ?? []
}

export async function getInspections(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.inspectorId) searchParams.set('inspectorId', params.inspectorId)
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
  if (params.dateTo) searchParams.set('dateTo', params.dateTo)
  searchParams.set('page', params.page ?? 1)
  searchParams.set('limit', params.limit ?? 200)
  const res = await get(`/api/lgu-officer/inspections?${searchParams}`)
  return res
}

export async function createInspection({ inspectorId, businessProfileId, businessId, permitType, inspectionType, scheduledDate, scheduledTimeWindow }) {
  const payload = { inspectorId, businessProfileId, businessId, permitType, inspectionType, scheduledDate }
  if (scheduledTimeWindow) payload.scheduledTimeWindow = scheduledTimeWindow
  const res = await post('/api/lgu-officer/inspections', payload)
  return res
}

export async function rescheduleInspection(id, { scheduledDate, scheduledTimeWindow, reason }) {
  const payload = { scheduledDate }
  if (scheduledTimeWindow) payload.scheduledTimeWindow = scheduledTimeWindow
  if (reason) payload.reason = reason
  const res = await put(`/api/lgu-officer/inspections/${id}/reschedule`, payload)
  return res
}
