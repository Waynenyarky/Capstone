import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/lgu-manager/inspections'

/**
 * Get pending inspections that need assignment
 */
export async function getPendingInspections() {
  try {
    const response = await get(`${BASE_PATH}/pending`)
    return Array.isArray(response) ? response : response?.inspections || []
  } catch (error) {
    console.error('Failed to fetch pending inspections:', error)
    throw error
  }
}

/**
 * Get list of available inspectors
 */
export async function getInspectors() {
  try {
    const response = await get('/api/lgu-manager/inspectors')
    return Array.isArray(response) ? response : response?.inspectors || []
  } catch (error) {
    console.error('Failed to fetch inspectors:', error)
    throw error
  }
}

/**
 * Assign inspection to an inspector
 */
export async function assignInspection(assignmentData) {
  try {
    const response = await post('/api/lgu-officer/inspections', {
      inspectorId: assignmentData.inspectorId,
      businessProfileId: assignmentData.businessProfileId,
      businessId: assignmentData.businessId,
      permitType: assignmentData.permitType || 'initial',
      inspectionType: assignmentData.inspectionType || 'initial',
      scheduledDate: assignmentData.scheduledDate,
      scheduledTimeWindow: assignmentData.scheduledTimeWindow,
      notes: assignmentData.notes
    })
    return response
  } catch (error) {
    console.error('Failed to assign inspection:', error)
    throw error
  }
}

/**
 * Get inspector workload
 */
export async function getInspectorWorkload(inspectorId) {
  try {
    const response = await get(`/api/lgu-manager/inspectors/${inspectorId}/workload`)
    return response || { activeInspections: 0, completedInspections: 0 }
  } catch (error) {
    console.error('Failed to fetch inspector workload:', error)
    return { activeInspections: 0, completedInspections: 0 }
  }
}

/**
 * Get inspector schedule
 */
export async function getInspectorSchedule(inspectorId, startDate, endDate) {
  try {
    const response = await get(`/api/lgu-manager/inspectors/${inspectorId}/schedule`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })
    return Array.isArray(response) ? response : response?.schedule || []
  } catch (error) {
    console.error('Failed to fetch inspector schedule:', error)
    throw error
  }
}

export default {
  getPendingInspections,
  getInspectors,
  assignInspection,
  getInspectorWorkload,
  getInspectorSchedule
}
