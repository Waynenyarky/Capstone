/**
 * Business Types - Shared constants for business classification
 * 
 * These values must match the backend enum in:
 * - backend/src/models/BusinessProfile.js
 * - backend/services/business-service/src/models/BusinessProfile.js
 * - backend/services/admin-service/src/models/BusinessProfile.js
 */

export const BUSINESS_TYPES = [
  { value: 'retail_trade', label: 'Retail Trade' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'services', label: 'Services' },
  { value: 'manufacturing_industrial', label: 'Manufacturing / Industrial' },
  { value: 'agriculture_fishery_forestry', label: 'Agriculture, Fishery & Forestry' },
  { value: 'construction_real_estate_housing', label: 'Construction, Real Estate & Housing' },
  { value: 'transportation_automotive_logistics', label: 'Transportation, Automotive & Logistics' },
  { value: 'financial_insurance_banking', label: 'Financial, Insurance & Banking' },
]

// Values only for validation and enums
export const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((t) => t.value)

// Map for quick lookup: value -> label
export const BUSINESS_TYPE_LABELS = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.value, t.label])
)

/**
 * Get display label for a business type value
 * @param {string} value - The business type enum value
 * @returns {string} - Human-readable label
 */
export function getBusinessTypeLabel(value) {
  return BUSINESS_TYPE_LABELS[value] || formatBusinessType(value)
}

/**
 * Format a business type value to a readable string (fallback)
 * @param {string} value - The business type enum value
 * @returns {string} - Formatted string
 */
export function formatBusinessType(value) {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Ant Design Select options format
export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}))
