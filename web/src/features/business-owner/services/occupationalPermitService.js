import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/occupational-permits';

/**
 * Get occupational permits for a business
 * @param {string} businessId - The ID of the business
 */
export async function getOccupationalPermits(businessId) {
  return get(`${BASE_PATH}/${businessId}`);
}

/**
 * Get lab exam results for a business
 * @param {string} businessId - The ID of the business
 */
export async function getLabExamResults(businessId) {
  return get(`${BASE_PATH}/${businessId}/lab-results`);
}

/**
 * Schedule a lab exam
 * @param {string} permitId - The ID of the permit
 * @param {object} schedulingData - The scheduling data
 */
export async function scheduleLabExam(permitId, schedulingData) {
  return post(`${BASE_PATH}/${permitId}/schedule-exam`, schedulingData);
}

/**
 * Get occupational permit details
 * @param {string} permitId - The ID of the permit
 */
export async function getOccupationalPermitDetails(permitId) {
  return get(`${BASE_PATH}/permits/${permitId}`);
}

/**
 * Update occupational permit
 * @param {string} permitId - The ID of the permit
 * @param {object} updateData - The update data
 */
export async function updateOccupationalPermit(permitId, updateData) {
  return post(`${BASE_PATH}/permits/${permitId}/update`, updateData);
}
