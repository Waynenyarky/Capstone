import { get, post, del } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/actions';

/**
 * Get all concurrent actions for a business
 * @param {string} businessId - The ID of the business
 */
export async function getConcurrentActions(businessId) {
  return get(`${BASE_PATH}/${businessId}/concurrent`);
}

/**
 * Cancel a specific action
 * @param {string} actionId - The ID of the action to cancel
 */
export async function cancelAction(actionId) {
  return del(`${BASE_PATH}/${actionId}`);
}

/**
 * Queue a new action
 * @param {string} businessId - The ID of the business
 * @param {object} actionData - The action data
 */
export async function queueAction(businessId, actionData) {
  return post(`${BASE_PATH}/${businessId}/queue`, actionData);
}
