/**
 * Business Types - PSIC 2019 Sections (Philippine Standard Industrial Classification)
 *
 * Official classification from Philippine Statistics Authority (PSA).
 * Used for business registration, permits, and form definitions.
 *
 * These values must match the backend enum in:
 * - backend/shared/constants/industries.js
 * - backend models (BusinessProfile, FormGroup, FormDefinition)
 */

export const BUSINESS_TYPES = [
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

// Values only for validation and enums
export const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((t) => t.value)

// Map for quick lookup: value -> label
export const BUSINESS_TYPE_LABELS = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.value, t.label])
)

/**
 * Get display label for a business type value (PSIC section)
 * @param {string} value - The PSIC section code (a-u)
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
