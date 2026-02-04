/**
 * Industry Constants - Shared across all backend services
 * 
 * Single source of truth for industry/business type enums.
 * 
 * These values must stay in sync with:
 * - web/src/constants/industries.js
 * - web/src/constants/businessTypes.js
 */

// Business types (actual industry classifications)
const BUSINESS_TYPES = [
  { value: 'retail_trade', label: 'Retail Trade' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'services', label: 'Services' },
  { value: 'manufacturing_industrial', label: 'Manufacturing / Industrial' },
  { value: 'agriculture_fishery_forestry', label: 'Agriculture, Fishery & Forestry' },
  { value: 'construction_real_estate_housing', label: 'Construction, Real Estate & Housing' },
  { value: 'transportation_automotive_logistics', label: 'Transportation, Automotive & Logistics' },
  { value: 'financial_insurance_banking', label: 'Financial, Insurance & Banking' },
]

// Values for MongoDB enums and validation
const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((t) => t.value)

// Labels map for quick lookup
const BUSINESS_TYPE_LABELS = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.value, t.label])
)

// Industry scope includes "all" for forms that apply to all business types
const INDUSTRY_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Industries' },
  ...BUSINESS_TYPES,
]

// Values for MongoDB enums and validation (includes 'all')
const INDUSTRY_SCOPE_VALUES = ['all', ...BUSINESS_TYPE_VALUES]

// Labels map including "all"
const INDUSTRY_SCOPE_LABELS = {
  all: 'All Industries',
  ...BUSINESS_TYPE_LABELS,
}

/**
 * Get display label for an industry scope value
 * @param {string} value - The industry scope enum value
 * @returns {string} - Human-readable label
 */
function getIndustryScopeLabel(value) {
  if (!value || value === 'all') return 'All Industries'
  return INDUSTRY_SCOPE_LABELS[value] || formatIndustryScope(value)
}

/**
 * Get display label for a business type value
 * @param {string} value - The business type enum value
 * @returns {string} - Human-readable label
 */
function getBusinessTypeLabel(value) {
  return BUSINESS_TYPE_LABELS[value] || formatIndustryScope(value)
}

/**
 * Format an industry scope value to a readable string (fallback)
 * @param {string} value - The value to format
 * @returns {string} - Formatted string
 */
function formatIndustryScope(value) {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

module.exports = {
  // Business types (without "all")
  BUSINESS_TYPES,
  BUSINESS_TYPE_VALUES,
  BUSINESS_TYPE_LABELS,
  getBusinessTypeLabel,
  
  // Industry scope (with "all")
  INDUSTRY_SCOPE_OPTIONS,
  INDUSTRY_SCOPE_VALUES,
  INDUSTRY_SCOPE_LABELS,
  getIndustryScopeLabel,
  
  // Utility
  formatIndustryScope,
}
