import { get, post, fetchWithFallback } from '@/lib/http.js'

const BASE_PATH = '/api/business/business-renewal'

/**
 * Get renewal period information
 * @param {string} businessId - Business ID
 */
export async function getRenewalPeriod(businessId) {
  return get(`${BASE_PATH}/${businessId}/period`)
}

/**
 * Start a renewal for a business
 * @param {string} businessId - Business ID
 * @param {number} renewalYear - Year for renewal
 */
export async function startRenewal(businessId, renewalYear) {
  return post(`${BASE_PATH}/${businessId}/start`, { renewalYear })
}

/**
 * Acknowledge renewal period
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 */
export async function acknowledgePeriod(businessId, renewalId) {
  return post(`${BASE_PATH}/${businessId}/${renewalId}/acknowledge-period`)
}

/**
 * Download renewal requirements PDF
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadRequirementsPdf(businessId, renewalId) {
  const response = await fetchWithFallback(
    `${BASE_PATH}/${businessId}/${renewalId}/requirements/pdf`,
    { method: 'GET' }
  )

  if (!response.ok) {
    throw new Error('Failed to download PDF')
  }

  return response.blob()
}

/**
 * Submit gross receipts declaration
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} grossReceiptsData - Gross receipts data
 */
export async function submitGrossReceipts(businessId, renewalId, grossReceiptsData) {
  return post(`${BASE_PATH}/${businessId}/${renewalId}/gross-receipts`, grossReceiptsData)
}

/**
 * Upload renewal documents
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} documents - Document URLs/data
 */
export async function uploadDocuments(businessId, renewalId, documents) {
  return post(`${BASE_PATH}/${businessId}/${renewalId}/documents/upload`, documents)
}

/**
 * Upload a single renewal file (to IPFS)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {File} file - File to upload
 * @param {string} fieldName - Field name for the document
 */
export async function uploadFile(businessId, renewalId, file, fieldName = 'file') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fieldName', fieldName)

  const response = await fetch(
    `${BASE_PATH}/${businessId}/${renewalId}/documents/upload-file`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to upload file')
  }

  return response.json()
}

/**
 * Get renewal assessment calculation
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 */
export async function getAssessment(businessId, renewalId) {
  return get(`${BASE_PATH}/${businessId}/${renewalId}/assessment`)
}

/**
 * Process renewal payment
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} paymentData - Payment data
 */
export async function processPayment(businessId, renewalId, paymentData) {
  return post(`${BASE_PATH}/${businessId}/${renewalId}/payment`, paymentData)
}

/**
 * Submit renewal application
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 */
export async function submitRenewal(businessId, renewalId) {
  return post(`${BASE_PATH}/${businessId}/${renewalId}/submit`)
}

/**
 * Get renewal status
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 */
export async function getRenewalStatus(businessId, renewalId) {
  return get(`${BASE_PATH}/${businessId}/${renewalId}/status`)
}
