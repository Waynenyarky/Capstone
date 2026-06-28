import { get } from '@/lib/http.js'

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
