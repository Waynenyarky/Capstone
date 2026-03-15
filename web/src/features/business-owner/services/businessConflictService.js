import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/conflicts';

/**
 * Get potential conflicts for a list of businesses
 * @param {string[]} businessIds - Array of business IDs
 */
export async function getBusinessConflicts(businessIds) {
  return post(`${BASE_PATH}/detect`, { businessIds });
}

/**
 * Resolve a specific conflict
 * @param {string} conflictId - The ID of the conflict
 * @param {string} resolution - The type of resolution ('auto' or 'manual')
 */
export async function resolveConflict(conflictId, resolution) {
  return post(`${BASE_PATH}/${conflictId}/resolve`, { resolution });
}

/**
 * Get conflict resolution history
 * @param {string} businessId - The ID of the business
 */
export async function getConflictHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}
