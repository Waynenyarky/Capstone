import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/permits';

/**
 * Get available permit categories
 */
export async function getPermitCategories() {
  return get(`${BASE_PATH}/categories`);
}

/**
 * Submit a new permit application
 * @param {object} applicationData - The application data
 */
export async function submitPermitApplication(applicationData) {
  return post(`${BASE_PATH}/apply`, applicationData);
}

/**
 * Get permit applications for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPermitApplications(businessId) {
  return get(`${BASE_PATH}/${businessId}/applications`);
}

/**
 * Get permit application details
 * @param {string} applicationId - The ID of the application
 */
export async function getPermitApplicationDetails(applicationId) {
  return get(`${BASE_PATH}/applications/${applicationId}`);
}

/**
 * Update permit application
 * @param {string} applicationId - The ID of the application
 * @param {object} updateData - The update data
 */
export async function updatePermitApplication(applicationId, updateData) {
  return post(`${BASE_PATH}/applications/${applicationId}/update`, updateData);
}
