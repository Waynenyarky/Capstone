import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/data-recovery';

/**
 * Get data corruption events for a business
 * @param {string} businessId - The ID of the business
 */
export async function getDataCorruptionEvents(businessId) {
  return get(`${BASE_PATH}/${businessId}/events`);
}

/**
 * Restore data from a backup
 * @param {string} eventId - The ID of the corruption event
 * @param {object} restoreData - The restore options
 */
export async function restoreBackup(eventId, restoreData) {
  return post(`${BASE_PATH}/events/${eventId}/restore`, restoreData);
}

/**
 * Validate data integrity for a business
 * @param {string} businessId - The ID of the business
 */
export async function validateIntegrity(businessId) {
  return post(`${BASE_PATH}/${businessId}/validate`);
}

/**
 * Get recovery history
 * @param {string} businessId - The ID of the business
 */
export async function getRecoveryHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}
