import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/timeline';

/**
 * Get timeline edge cases for a business
 * @param {string} businessId - The ID of the business
 */
export async function getTimelineEdgeCases(businessId) {
  return get(`${BASE_PATH}/${businessId}/edge-cases`);
}

/**
 * Submit an extension request for a deadline
 * @param {string} caseId - The ID of the edge case
 * @param {object} requestData - The extension request data
 */
export async function submitExtensionRequest(caseId, requestData) {
  return post(`${BASE_PATH}/edge-cases/${caseId}/extension`, requestData);
}

/**
 * Get timeline adjustments history
 * @param {string} businessId - The ID of the business
 */
export async function getTimelineHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}
