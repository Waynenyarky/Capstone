import apiClient from '@/services/apiClient';

/**
 * Get clearance status for a business
 * @param {string} businessId
 * @returns {Promise<Object>}
 */
export async function getClearanceStatus(businessId) {
  const response = await apiClient.get(`/api/business/clearances/${businessId}/status`);
  return response.data;
}

/**
 * Get full clearance details for a business
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function getClearancesByBusiness(businessId) {
  const response = await apiClient.get(`/api/business/clearances/${businessId}`);
  return response.data;
}

/**
 * Get clearance processing timeline
 * @param {string} businessId
 * @returns {Promise<Object>}
 */
export async function getClearanceTimeline(businessId) {
  const response = await apiClient.get(`/api/business/clearances/${businessId}/timeline`);
  return response.data;
}

/**
 * Get next pending agency
 * @param {string} businessId
 * @returns {Promise<Object>}
 */
export async function getNextPendingAgency(businessId) {
  const response = await apiClient.get(`/api/business/clearances/${businessId}/next-agency`);
  return response.data;
}

/**
 * Initiate clearance process (LGU Officer/Manager only)
 * @param {string} businessId
 * @param {string} applicationId
 * @returns {Promise<Object>}
 */
export async function initiateClearance(businessId, applicationId) {
  const response = await apiClient.post(`/api/business/clearances/${businessId}/initiate`, {
    applicationId
  });
  return response.data;
}

/**
 * Submit to specific agency (LGU Officer/Manager only)
 * @param {string} businessId
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function submitToAgency(businessId, agency, data) {
  const response = await apiClient.post(`/api/business/clearances/${businessId}/${agency}/submit`, data);
  return response.data;
}

/**
 * Start agency review (Agency Reviewer only)
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function startAgencyReview(agency, data) {
  const response = await apiClient.post(`/api/agency/${agency}/review`, data);
  return response.data;
}

/**
 * Approve agency clearance (Agency Reviewer only)
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function approveAgencyClearance(agency, data) {
  const response = await apiClient.post(`/api/agency/${agency}/approve`, data);
  return response.data;
}

/**
 * Reject agency clearance (Agency Reviewer only)
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function rejectAgencyClearance(agency, data) {
  const response = await apiClient.post(`/api/agency/${agency}/reject`, data);
  return response.data;
}

/**
 * Raise deficiency (Agency Reviewer only)
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function raiseDeficiency(agency, data) {
  const response = await apiClient.post(`/api/agency/${agency}/deficiency`, data);
  return response.data;
}

/**
 * Resolve deficiency (Business Owner or LGU)
 * @param {string} agency
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function resolveDeficiency(agency, data) {
  const response = await apiClient.post(`/api/agency/${agency}/resolve-deficiency`, data);
  return response.data;
}

/**
 * Get agency work queue (LGU/Agency staff only)
 * @param {string} agency
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getAgencyQueue(agency, params = {}) {
  const response = await apiClient.get(`/api/agency/${agency}/queue`, { params });
  return response.data;
}

/**
 * Send clearance notification (LGU only)
 * @param {string} businessId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function sendClearanceNotification(businessId, data) {
  const response = await apiClient.post(`/api/business/clearances/${businessId}/notify`, data);
  return response.data;
}

// Agency mapping for display
export const AGENCY_NAMES = {
  BARANGAY: 'Barangay Office',
  ZONING: 'Zoning & Planning',
  SANITARY: 'Sanitary/Health Office',
  FIRE_SAFETY: 'Fire Safety (BFP)',
  BFP: 'Bureau of Fire Protection',
  TREASURY: 'Treasury Office',
  MAYORS_OFFICE: "Mayor's Office"
};

// Agency order for clearance processing
export const AGENCY_ORDER = ['BARANGAY', 'ZONING', 'SANITARY', 'FIRE_SAFETY', 'BFP', 'TREASURY', 'MAYORS_OFFICE'];

// Required agencies that must be approved
export const REQUIRED_AGENCIES = ['BARANGAY', 'ZONING', 'SANITARY', 'FIRE_SAFETY'];

// Status colors for UI
export const STATUS_COLORS = {
  PENDING: 'default',
  UNDER_REVIEW: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  WAIVED: 'warning',
  CONDITIONAL: 'warning'
};

// Status labels
export const STATUS_LABELS = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WAIVED: 'Waived',
  CONDITIONAL: 'Conditional'
};
