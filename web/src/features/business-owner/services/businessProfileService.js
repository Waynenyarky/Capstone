import { get, post, put, patch, del } from '@/lib/http.js'

const BASE_PATH = '/api/business'

/**
 * Get the current user's business profile
 */
export async function getProfile() {
  return get(`${BASE_PATH}/profile`)
}

/**
 * Update business profile step
 * @param {number} step - Step number
 * @param {object} data - Step data
 */
export async function updateProfileStep(step, data) {
  return post(`${BASE_PATH}/profile`, { step, data })
}

/**
 * Upload owner ID image
 * @param {File} file - Image file
 * @param {'front' | 'back'} side - Which side of the ID
 */
export async function uploadOwnerId(file, side = 'front') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('side', side)

  const response = await fetch(`${BASE_PATH}/profile/owner-id/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to upload ID')
  }

  return response.json()
}

/**
 * Get all businesses for the current user
 */
export async function getBusinesses() {
  const data = await get(`${BASE_PATH}/businesses`)
  return data?.businesses || []
}

/**
 * Get primary business
 */
export async function getPrimaryBusiness() {
  const data = await get(`${BASE_PATH}/businesses/primary`)
  return data?.business || null
}

/**
 * Add a new business
 * @param {object} businessData - Business data
 */
export async function addBusiness(businessData) {
  return post(`${BASE_PATH}/businesses`, businessData)
}

/**
 * Update a business
 * @param {string} businessId - Business ID
 * @param {object} businessData - Updated business data
 */
export async function updateBusiness(businessId, businessData) {
  return put(`${BASE_PATH}/businesses/${businessId}`, businessData)
}

/**
 * Update business status only
 * @param {string} businessId - Business ID
 * @param {'active' | 'inactive' | 'closed'} businessStatus - New status
 */
export async function updateBusinessStatus(businessId, businessStatus) {
  return patch(`${BASE_PATH}/businesses/${businessId}`, { businessStatus })
}

/**
 * Delete a business
 * @param {string} businessId - Business ID
 */
export async function deleteBusiness(businessId) {
  return del(`${BASE_PATH}/businesses/${businessId}`)
}

/**
 * Set a business as primary
 * @param {string} businessId - Business ID
 */
export async function setPrimaryBusiness(businessId) {
  return post(`${BASE_PATH}/businesses/${businessId}/primary`)
}

/**
 * Update business risk profile
 * @param {string} businessId - Business ID
 * @param {object} riskProfileData - Risk profile data
 */
export async function updateRiskProfile(businessId, riskProfileData) {
  return put(`${BASE_PATH}/businesses/${businessId}/risk-profile`, riskProfileData)
}
