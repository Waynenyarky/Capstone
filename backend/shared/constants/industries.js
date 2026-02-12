/**
 * Industry Constants - PSIC 2019 Sections (Philippine Standard Industrial Classification)
 *
 * Single source of truth for industry/business type enums.
 * Official classification from Philippine Statistics Authority (PSA).
 *
 * These values must stay in sync with:
 * - web/src/constants/industries.js
 * - web/src/constants/businessTypes.js
 */

// PSIC 2019 Sections (business types)
const BUSINESS_TYPES = [
  { value: 'a', label: 'Agriculture, forestry and fishing' },
  { value: 'b', label: 'Mining and quarrying' },
  { value: 'c', label: 'Manufacturing' },
  { value: 'd', label: 'Electricity, gas, steam and air conditioning supply' },
  { value: 'e', label: 'Water supply; sewerage; waste management and remediation activities' },
  { value: 'f', label: 'Construction' },
  { value: 'g', label: 'Wholesale and retail trade; repair of motor vehicles and motorcycles' },
  { value: 'h', label: 'Transport and storage' },
  { value: 'i', label: 'Accommodation and food service activities' },
  { value: 'j', label: 'Information and communication' },
  { value: 'k', label: 'Financial and insurance activities' },
  { value: 'l', label: 'Real estate activities' },
  { value: 'm', label: 'Professional, scientific and technical activities' },
  { value: 'n', label: 'Administrative and support service activities' },
  { value: 'o', label: 'Public administration and defence; compulsory social security' },
  { value: 'p', label: 'Education' },
  { value: 'q', label: 'Human health and social work activities' },
  { value: 'r', label: 'Arts, entertainment and recreation' },
  { value: 's', label: 'Other service activities' },
  { value: 't', label: 'Activities of households as employers' },
  { value: 'u', label: 'Activities of extraterritorial organizations and bodies' },
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
  // Business types (PSIC sections, without "all")
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
