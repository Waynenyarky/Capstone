import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/compliance';

/**
 * Get compliance overview for a business
 * @param {string} businessId - The ID of the business
 */
export async function getComplianceOverview(businessId) {
  return get(`${BASE_PATH}/${businessId}/overview`);
}

/**
 * Get upcoming compliance deadlines
 * @param {string} businessId - The ID of the business
 */
export async function getUpcomingDeadlines(businessId) {
  return get(`${BASE_PATH}/${businessId}/deadlines`);
}

/**
 * Get active violations for a business
 * @param {string} businessId - The ID of the business
 */
export async function getActiveViolations(businessId) {
  return get(`${BASE_PATH}/${businessId}/violations`);
}

/**
 * Get ongoing requirements for a business
 * @param {string} businessId - The ID of the business
 */
export async function getOngoingRequirements(businessId) {
  return get(`${BASE_PATH}/${businessId}/requirements`);
}

/**
 * Update a compliance requirement
 * @param {string} requirementId - The ID of the requirement
 * @param {object} updateData - The update data
 */
export async function updateRequirement(requirementId, updateData) {
  return post(`${BASE_PATH}/requirements/${requirementId}/update`, updateData);
}

/**
 * Get requirement history
 * @param {string} requirementId - The ID of the requirement
 */
export async function getRequirementHistory(requirementId) {
  return get(`${BASE_PATH}/requirements/${requirementId}/history`);
}

/**
 * Get improvement recommendations for a business
 * @param {string} businessId - The ID of the business
 */
export async function getImprovementRecommendations(businessId) {
  return get(`${BASE_PATH}/${businessId}/recommendations`);
}

/**
 * Implement a recommendation
 * @param {string} recommendationId - The ID of the recommendation
 */
export async function implementRecommendation(recommendationId) {
  return post(`${BASE_PATH}/recommendations/${recommendationId}/implement`);
}

/**
 * Track recommendation progress
 * @param {string} recommendationId - The ID of the recommendation
 */
export async function trackRecommendationProgress(recommendationId) {
  return get(`${BASE_PATH}/recommendations/${recommendationId}/progress`);
}

/**
 * Get compliance score history
 * @param {string} businessId - The ID of the business
 */
export async function getComplianceScoreHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/score-history`);
}

/**
 * Get compliance trends
 * @param {string} businessId - The ID of the business
 */
export async function getComplianceTrends(businessId) {
  return get(`${BASE_PATH}/${businessId}/trends`);
}
