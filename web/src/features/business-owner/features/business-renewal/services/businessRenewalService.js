import { get, post } from '@/lib/http'
import { fetchWithFallback, fetchJsonWithFallback } from '@/lib/http'

/**
 * Get current renewal period
 * @param {string} businessId - Business ID
 * @returns {Promise<object>} Renewal period information
 */
export const getRenewalPeriod = async (businessId) => {
  return get(`/api/business/business-renewal/${businessId}/period`)
}

/**
 * Start a new renewal application
 * @param {string} businessId - Business ID
 * @param {number} renewalYear - Year being renewed (e.g., 2026)
 * @returns {Promise<object>} Created renewal application
 */
export const startRenewal = async (businessId, renewalYear) => {
  return post(`/api/business/business-renewal/${businessId}/start`, { renewalYear })
}

/**
 * Acknowledge renewal period (Step 2)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<object>} Updated profile
 */
export const acknowledgeRenewalPeriod = async (businessId, renewalId) => {
  return post(`/api/business/business-renewal/${businessId}/${renewalId}/acknowledge-period`)
}

/**
 * Download renewal requirements PDF (Step 4)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<void>}
 */
export const downloadRenewalRequirementsPDF = async (businessId, renewalId) => {
  const apiUrl = `/api/business/business-renewal/${businessId}/${renewalId}/requirements/pdf`

  try {
    const response = await fetchWithFallback(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf, application/json'
      }
    })
    
    if (!response) {
      throw new Error('Network error: Unable to connect to server')
    }
    
    if (!response.ok) {
      let errorMessage = `Failed to download PDF (HTTP ${response.status})`
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.clone().json()
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData?.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }
      } else {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/pdf')) {
      let errorMessage = 'Response is not a PDF file'
      try {
        const errorData = await response.clone().json()
        errorMessage = errorData?.error?.message || errorData?.message || errorMessage
      } catch (e) {
        // Not JSON, use default message
      }
      throw new Error(errorMessage)
    }
    
    const blob = await response.blob()
    
    if (blob.size === 0) {
      throw new Error('PDF file is empty')
    }
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Business_Renewal_Requirements_Checklist_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      if (document.body.contains(a)) {
        document.body.removeChild(a)
      }
    }, 100)
  } catch (error) {
    console.error('PDF download error:', error)
    if (error.message && !error.message.includes('Failed to download')) {
      throw error
    }
    throw new Error(error.message || 'Failed to download PDF. Please check your connection and try again.')
  }
}

/**
 * Update gross receipts declaration (Step 5)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} grossReceiptsData - Gross receipts data
 * @returns {Promise<object>} Updated profile
 */
export const updateGrossReceipts = async (businessId, renewalId, grossReceiptsData) => {
  return post(`/api/business/business-renewal/${businessId}/${renewalId}/gross-receipts`, grossReceiptsData)
}

/**
 * Upload renewal documents (Step 6)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} documents - Document URLs/CIDs
 * @returns {Promise<object>} Updated profile
 */
export const uploadRenewalDocuments = async (businessId, renewalId, documents) => {
  return post(`/api/business/business-renewal/${businessId}/${renewalId}/documents/upload`, documents)
}

/**
 * Upload a single renewal document file (Step 6)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {File} file - File to upload
 * @param {string} fieldName - Document field name
 * @returns {Promise<object>} Upload result with URL/CID
 */
export const uploadRenewalFile = async (businessId, renewalId, file, fieldName) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fieldName', fieldName)

  const res = await fetchWithFallback(`/api/business/business-renewal/${businessId}/${renewalId}/documents/upload-file`, {
    method: 'POST',
    body: formData
  })

  if (!res || !res.ok) {
    return fetchJsonWithFallback(`/api/business/business-renewal/${businessId}/${renewalId}/documents/upload-file`, {
      method: 'POST',
      body: formData
    })
  }

  return res.json()
}

/**
 * Calculate renewal assessment (Step 7)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<object>} Calculated assessment
 */
export const calculateAssessment = async (businessId, renewalId) => {
  return get(`/api/business/business-renewal/${businessId}/${renewalId}/assessment`)
}

/**
 * Process renewal payment (Step 8)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @param {object} paymentData - Payment information
 * @returns {Promise<object>} Updated profile
 */
export const processPayment = async (businessId, renewalId, paymentData) => {
  return post(`/api/business/business-renewal/${businessId}/${renewalId}/payment`, paymentData)
}

/**
 * Submit renewal application (Final Step)
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<object>} Submission result with reference number
 */
export const submitRenewal = async (businessId, renewalId) => {
  return post(`/api/business/business-renewal/${businessId}/${renewalId}/submit`)
}

/**
 * Get renewal status
 * @param {string} businessId - Business ID
 * @param {string} renewalId - Renewal ID
 * @returns {Promise<object>} Renewal status information
 */
export const getRenewalStatus = async (businessId, renewalId) => {
  return get(`/api/business/business-renewal/${businessId}/${renewalId}/status`)
}
