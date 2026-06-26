import apiClient from '@/services/apiClient';

/**
 * Get available inspection slots
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} inspectorId - Optional inspector filter
 * @param {string} barangay - Optional barangay filter
 * @returns {Promise<Array>}
 */
export async function getAvailableSlots(startDate, endDate, inspectorId = null, barangay = null) {
  const params = { startDate, endDate };
  if (inspectorId) params.inspectorId = inspectorId;
  if (barangay) params.barangay = barangay;
  
  const response = await apiClient.get('/api/inspections/available-slots', { params });
  return response.data.slots;
}

/**
 * Book an inspection slot
 * @param {string} slotId
 * @param {string} businessId
 * @param {string} inspectionType
 * @param {string} notes
 * @returns {Promise<Object>}
 */
export async function bookSlot(slotId, businessId, inspectionType = 'INITIAL', notes = '') {
  const response = await apiClient.post('/api/inspections/book', {
    slotId,
    businessId,
    inspectionType,
    notes
  });
  return response.data;
}

/**
 * Cancel a booking
 * @param {string} slotId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export async function cancelBooking(slotId, reason) {
  const response = await apiClient.post('/api/inspections/cancel', {
    slotId,
    reason
  });
  return response.data;
}

/**
 * Reschedule a booking
 * @param {string} oldSlotId
 * @param {string} newSlotId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export async function rescheduleBooking(oldSlotId, newSlotId, reason) {
  const response = await apiClient.post('/api/inspections/reschedule', {
    oldSlotId,
    newSlotId,
    reason
  });
  return response.data;
}

/**
 * Get upcoming inspections for a business
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function getUpcomingInspections(businessId) {
  const response = await apiClient.get(`/api/inspections/upcoming/${businessId}`);
  return response.data.inspections;
}

/**
 * Get inspection history for a business
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function getInspectionHistory(businessId) {
  const response = await apiClient.get(`/api/inspections/history/${businessId}`);
  return response.data.history;
}

/**
 * Check prerequisites for scheduling
 * @param {string} businessId
 * @returns {Promise<Object>}
 */
export async function checkPrerequisites(businessId) {
  const response = await apiClient.get(`/api/inspections/prerequisites/${businessId}`);
  return response.data;
}

/**
 * Create inspection slots (Admin only)
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createInspectionSlots(data) {
  const response = await apiClient.post('/api/inspections/slots/create', data);
  return response.data;
}

/**
 * Get inspector schedule
 * @param {string} inspectorId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Array>}
 */
export async function getInspectorSchedule(inspectorId, startDate, endDate) {
  const response = await apiClient.get(`/api/inspections/inspector-schedule/${inspectorId}`, {
    params: { startDate, endDate }
  });
  return response.data.schedule;
}

/**
 * Complete an inspection (Inspector only)
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function completeInspection(data) {
  const response = await apiClient.post('/api/inspections/complete', data);
  return response.data;
}

// Inspection type labels
export const INSPECTION_TYPE_LABELS = {
  INITIAL: 'Initial Inspection',
  RENEWAL: 'Renewal Inspection',
  COMPLIANCE: 'Compliance Check',
  FOLLOW_UP: 'Follow-up Inspection',
  COMPLAINT: 'Complaint Inspection'
};

// Inspection status labels
export const INSPECTION_STATUS_LABELS = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
};

// Completion status labels
export const COMPLETION_STATUS_LABELS = {
  PASS: 'Passed',
  FAIL: 'Failed',
  NEEDS_FOLLOW_UP: 'Needs Follow-up'
};
