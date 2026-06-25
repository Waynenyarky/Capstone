import { get, post } from '@/lib/http.js'

export async function getFeePreview(lob) {
  if (!lob) return null
  return get(`/api/business/fee-preview?lob=${encodeURIComponent(lob)}`)
}

/**
 * Get fee group details for a permit type (public endpoint for business owners)
 * @param {string} formType - Form type (permit, general_permit, renewal, etc.)
 * @param {string} category - Category (for general_permit)
 */
export async function getFeeGroupForForm(formType, category = null) {
  const params = new URLSearchParams()
  params.append('formType', formType)
  if (category) params.append('category', category)
  return get(`/api/business/fee-group?${params.toString()}`)
}

/**
 * Calculate what-if fee scenarios
 * @param {object} businessData - Business parameters for calculation
 */
export async function calculateWhatIfFees(businessData) {
  return post('/api/business/fees/what-if', businessData)
}

/**
 * Get fee impact analysis for parameter changes
 * @param {string} businessId - Business ID
 * @param {object} changes - Parameter changes to analyze
 */
export async function getFeeImpactAnalysis(businessId, changes) {
  return post(`/api/business/fees/impact/${businessId}`, changes)
}

/**
 * Compare fees between different business scenarios
 * @param {object} scenarios - Array of business scenarios to compare
 */
export async function compareFeeScenarios(scenarios) {
  return post('/api/business/fees/compare', { scenarios })
}

/**
 * Get fee calculation breakdown
 * @param {object} businessData - Business data for detailed breakdown
 */
export async function getFeeBreakdown(businessData) {
  return post('/api/business/fees/breakdown', businessData)
}

/**
 * Get historical fee changes
 * @param {string} businessId - Business ID (optional)
 */
export async function getFeeHistory(businessId = null) {
  const url = businessId 
    ? `/api/business/fees/history/${businessId}`
    : '/api/business/fees/history'
  return get(url)
}

/**
 * Get fee optimization suggestions
 * @param {string} businessId - Business ID
 */
export async function getFeeOptimizationSuggestions(businessId) {
  return get(`/api/business/fees/optimization/${businessId}`)
}

/**
 * Project future fees based on growth parameters
 * @param {object} projectionData - Growth and business parameters
 */
export async function projectFutureFees(projectionData) {
  return post('/api/business/fees/project', projectionData)
}
