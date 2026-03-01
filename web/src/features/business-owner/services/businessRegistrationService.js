import { get, post, fetchWithFallback } from '@/lib/http.js'

const BASE_PATH = '/api/business/business-registration'

/**
 * Confirm requirements checklist has been viewed
 * @param {string} businessId - Business ID (or 'new' for new registrations)
 */
export async function confirmRequirements(businessId) {
  return post(`${BASE_PATH}/${businessId}/requirements/confirm`)
}

/**
 * Download requirements checklist PDF
 * @param {string} businessId - Business ID (or 'new' for new registrations)
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadRequirementsPdf(businessId) {
  const response = await fetchWithFallback(`${BASE_PATH}/${businessId}/requirements/pdf`, {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error('Failed to download PDF')
  }

  return response.blob()
}

/**
 * Upload LGU documents
 * @param {string} businessId - Business ID
 * @param {object} documents - Document URLs/data
 */
export async function uploadDocuments(businessId, documents) {
  return post(`${BASE_PATH}/${businessId}/documents/upload`, documents)
}

/**
 * Upload a single file (to IPFS)
 * @param {string} businessId - Business ID
 * @param {File} file - File to upload
 * @param {string} fieldName - Field name for the document
 */
export async function uploadFile(businessId, file, fieldName = 'file') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fieldName', fieldName)

  const response = await fetchWithFallback(`${BASE_PATH}/${businessId}/documents/upload-file`, {
    method: 'POST',
    body: formData,
  })

  if (!response || !response.ok) {
    const err = await response?.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to upload file')
  }

  return response.json()
}

/**
 * Save BIR registration info
 * @param {string} businessId - Business ID
 * @param {object} birData - BIR registration data
 */
export async function saveBirRegistration(businessId, birData) {
  return post(`${BASE_PATH}/${businessId}/bir`, birData)
}

/**
 * Save other agency registrations
 * @param {string} businessId - Business ID
 * @param {object} agencyData - Agency registration data
 */
export async function saveAgencyRegistrations(businessId, agencyData) {
  return post(`${BASE_PATH}/${businessId}/agencies`, agencyData)
}

/**
 * Submit business registration application
 * @param {string} businessId - Business ID
 */
export async function submitApplication(businessId) {
  return post(`${BASE_PATH}/${businessId}/submit`)
}

/**
 * Get application status
 * @param {string} businessId - Business ID
 */
export async function getApplicationStatus(businessId) {
  return get(`${BASE_PATH}/${businessId}/status`)
}
