/**
 * Service for LGU Manager inspection assignment
 */
import { fetchJsonWithFallback, post, get } from '@/lib/http.js'

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
  searchParams.set('limit', params.limit ?? 20)
  const res = await get(`/api/lgu-officer/inspections?${searchParams}`)
  return res
}

export async function createInspection({ inspectorId, businessProfileId, businessId, permitType, inspectionType, scheduledDate }) {
  const res = await post('/api/lgu-officer/inspections', {
    inspectorId,
    businessProfileId,
    businessId,
    permitType,
    inspectionType,
    scheduledDate,
  })
  return res
}
