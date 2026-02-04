/**
 * Industry Scope Constants - For form definitions and targeting
 * 
 * Uses BUSINESS_TYPES directly for industry scope options.
 * 
 * These values must stay in sync with:
 * - backend/shared/constants/industries.js
 */

import { BUSINESS_TYPES, BUSINESS_TYPE_VALUES, BUSINESS_TYPE_LABELS } from './businessTypes'

// Industry scope options - uses business types directly
export const INDUSTRY_SCOPE_OPTIONS = [...BUSINESS_TYPES]

// Values for validation and enums
export const INDUSTRY_SCOPE_VALUES = [...BUSINESS_TYPE_VALUES]

// Labels map
export const INDUSTRY_SCOPE_LABELS = { ...BUSINESS_TYPE_LABELS }

/**
 * Get display label for an industry scope value
 * @param {string} value - The industry scope enum value
 * @returns {string} - Human-readable label
 */
export function getIndustryScopeLabel(value) {
  if (!value) return ''
  return INDUSTRY_SCOPE_LABELS[value] || formatIndustryScope(value)
}

/**
 * Format an industry scope value to a readable string (fallback)
 * @param {string} value - The industry scope enum value
 * @returns {string} - Formatted string
 */
export function formatIndustryScope(value) {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
