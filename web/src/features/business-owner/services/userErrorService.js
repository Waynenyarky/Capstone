import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/user-error';

/**
 * Get user error patterns for a business
 * @param {string} businessId - The ID of the business
 */
export async function getUserErrorPatterns(businessId) {
  return get(`${BASE_PATH}/${businessId}/patterns`);
}

/**
 * Update error prevention settings
 * @param {string} patternId - The ID of the error pattern
 * @param {object} settings - The prevention settings
 */
export async function preventError(patternId, settings) {
  return post(`${BASE_PATH}/patterns/${patternId}/prevent`, settings);
}

/**
 * Undo a specific action
 * @param {string} actionId - The ID of the action to undo
 */
export async function undoAction(actionId) {
  return post(`${BASE_PATH}/actions/${actionId}/undo`);
}

/**
 * Get error prevention history
 * @param {string} businessId - The ID of the business
 */
export async function getErrorHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}
