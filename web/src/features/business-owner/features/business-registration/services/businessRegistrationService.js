import { get, post } from '@/lib/http'
import { fetchWithFallback, fetchJsonWithFallback } from '@/lib/http'

// Requirements Checklist
export const confirmRequirementsChecklist = async (businessId) => {
  return post(`/api/business/business-registration/${businessId}/requirements/confirm`)
}

export const downloadRequirementsPDF = async (businessId) => {
  const apiUrl = `/api/business/business-registration/${businessId}/requirements/pdf`

  try {
    // Use fetchWithFallback for proper authentication and URL handling
    // This function handles auth tokens and fallback URLs automatically
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
      // Try to get error message from response
      let errorMessage = `Failed to download PDF (HTTP ${response.status})`
      const contentType = response.headers.get('content-type')
      
      // Only try to parse JSON if the response is JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.clone().json()
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData?.message) {
            errorMessage = errorData.message
          } else if (errorData?.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage
          }
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }
      } else {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    // Check if response is actually a PDF
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/pdf')) {
      // If not PDF, try to read error message
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
    a.download = `Business_Registration_Requirements_Checklist_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    
    // Clean up after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      if (document.body.contains(a)) {
        document.body.removeChild(a)
      }
    }, 100)
  } catch (error) {
    console.error('PDF download error:', error)
    // Re-throw with more context if needed
    if (error.message && !error.message.includes('Failed to download')) {
      throw error
    }
    throw new Error(error.message || 'Failed to download PDF. Please check your connection and try again.')
  }
}

// LGU Documents Upload
export const uploadLGUDocuments = async (businessId, documents) => {
  return post(`/api/business/business-registration/${businessId}/documents/upload`, documents)
}

export const uploadBusinessRegistrationFile = async (businessId, file, fieldName) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fieldName', fieldName)

  const res = await fetchWithFallback(`/api/business/business-registration/${businessId}/documents/upload-file`, {
    method: 'POST',
    body: formData
  })

  if (!res || !res.ok) {
    return fetchJsonWithFallback(`/api/business/business-registration/${businessId}/documents/upload-file`, {
      method: 'POST',
      body: formData
    })
  }

  return res.json()
}

// BIR Registration
export const saveBIRRegistration = async (businessId, birData) => {
  return post(`/api/business/business-registration/${businessId}/bir`, birData)
}

// Other Agency Registrations
export const saveOtherAgencyRegistrations = async (businessId, agencyData) => {
  return post(`/api/business/business-registration/${businessId}/agencies`, agencyData)
}

// Submit Application
export const submitBusinessApplication = async (businessId) => {
  return post(`/api/business/business-registration/${businessId}/submit`)
}

// Get Application Status
export const getApplicationStatus = async (businessId) => {
  return get(`/api/business/business-registration/${businessId}/status`)
}
