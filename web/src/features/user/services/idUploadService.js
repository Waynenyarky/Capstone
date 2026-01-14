import { authHeaders } from '@/lib/http.js'
import { fetchJsonWithFallback } from '@/lib/http.js'

/**
 * Upload ID documents (front and back)
 * @param {FormData} formData - FormData with 'front' and optionally 'back' files, plus verificationCode or mfaCode
 * @returns {Promise}
 */
export async function uploadIdDocuments(formData, currentUser, role) {
  const headers = authHeaders(currentUser, role)
  // Don't set Content-Type - browser will set it with boundary for multipart/form-data
  delete headers['Content-Type']
  
  return fetchJsonWithFallback('/api/auth/profile/id-upload', {
    method: 'POST',
    headers,
    body: formData,
  })
}

/**
 * Get ID verification status
 * @returns {Promise}
 */
export async function getIdVerificationStatus(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/auth/profile/id-info', {
    method: 'GET',
    headers,
  })
}

/**
 * Update ID info (type and number)
 * @param {Object} payload - { idType, idNumber, verificationCode?, mfaCode? }
 * @returns {Promise}
 */
export async function updateIdInfo(payload, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/profile/id-info', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}

/**
 * Revert ID upload (within 24 hours)
 * @returns {Promise}
 */
export async function revertIdUpload(currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/profile/id-upload/revert', {
    method: 'POST',
    headers,
  })
}
