import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/risk-profile';

/**
 * Get the risk profile for a business
 * @param {string} businessId - The ID of the business
 */
export async function getRiskProfile(businessId) {
  return get(`${BASE_PATH}/${businessId}`);
}

/**
 * Get the breakdown of risk factors
 * @param {string} businessId - The ID of the business
 */
export async function getRiskFactors(businessId) {
  return get(`${BASE_PATH}/${businessId}/factors`);
}

/**
 * Get the analysis of how risk impacts fees and inspections
 * @param {string} businessId - The ID of the business
 */
export async function getRiskImpactAnalysis(businessId) {
  return get(`${BASE_PATH}/${businessId}/impact`);
}

/**
 * Get recommendations for reducing business risk
 * @param {string} businessId - The ID of the business
 */
export async function getRiskReductionRecommendations(businessId) {
  return get(`${BASE_PATH}/${businessId}/recommendations`);
}

/**
 * Get the history of risk profile changes
 * @param {string} businessId - The ID of the business
 */
export async function getRiskHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}

/**
 * Submit an appeal for a risk level assessment
 * @param {string} businessId - The ID of the business
 * @param {object} appealData - The data for the appeal
 */
export async function submitRiskAppeal(businessId, appealData) {
  return post(`${BASE_PATH}/${businessId}/appeal`, appealData);
}
