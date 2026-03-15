import apiClient from '@/services/apiClient';

/**
 * Get all violations for a business
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function getViolations(businessId) {
  const response = await apiClient.get(`/api/business/violations/${businessId}`);
  return response.data;
}

/**
 * Get violation details
 * @param {string} violationId
 * @returns {Promise<Object>}
 */
export async function getViolationDetails(violationId) {
  const response = await apiClient.get(`/api/violations/${violationId}`);
  return response.data;
}

/**
 * Submit compliance for a violation
 * @param {string} violationId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function submitCompliance(violationId, data) {
  const response = await apiClient.post(`/api/violations/${violationId}/compliance`, data);
  return response.data;
}

/**
 * Appeal a violation
 * @param {string} violationId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function appealViolation(violationId, data) {
  const response = await apiClient.post(`/api/violations/${violationId}/appeal`, data);
  return response.data;
}

/**
 * Get violation statistics
 * @param {string} businessId
 * @returns {Promise<Object>}
 */
export async function getViolationStats(businessId) {
  const response = await apiClient.get(`/api/business/violations/${businessId}/stats`);
  return response.data;
}

// Violation severity levels
export const VIOLATION_SEVERITY = {
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  CRITICAL: 'Critical'
};

// Violation status
export const VIOLATION_STATUS = {
  PENDING: 'Pending',
  COMPLIED: 'Complied',
  OVERDUE: 'Overdue',
  APPEALED: 'Under Appeal',
  ESCALATED: 'Escalated',
  DISMISSED: 'Dismissed'
};

// Common violation types
export const VIOLATION_TYPES = {
  SANITATION: 'Sanitation Violation',
  FIRE_SAFETY: 'Fire Safety Violation',
  ZONING: 'Zoning Violation',
  ENVIRONMENTAL: 'Environmental Violation',
  PERMIT: 'Permit Violation',
  TAX: 'Tax Compliance Violation',
  OPERATING_HOURS: 'Operating Hours Violation',
  OTHER: 'Other Violation'
};
