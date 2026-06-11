import { post, get } from '@/lib/http.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'
import QRCode from 'qrcode'

const BASE_PATH = '/api/business/permits'

/**
 * Generate unique permit number
 * Format: MP-YYYY-XXXXX (MP = Mayor's Permit)
 */
export function generatePermitNumber(year = new Date().getFullYear()) {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MP-${year}-${timestamp.toString().slice(-5)}${random}`
}

/**
 * Generate QR code for permit verification
 * @param {string} permitNumber - Permit number
 * @param {object} permitData - Permit data for verification
 * @returns {Promise<string>} Base64 QR code image
 */
export async function generatePermitQRCode(permitNumber, permitData) {
  const verificationData = {
    permitNumber,
    businessId: permitData.businessId,
    businessName: permitData.businessName,
    issuedDate: permitData.issuedDate,
    expiryDate: permitData.expiryDate,
    verificationUrl: `${window.location.origin}/verify-permit/${permitNumber}`
  }
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(verificationData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 200
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('QR code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Request permit issuance from backend
 * @param {string} businessId - Business ID
 * @param {string} permitType - 'initial' or 'renewal'
 * @returns {Promise<object>} Issued permit data
 */
export async function issuePermit(businessId, permitType = 'initial') {
  try {
    const response = await post(`${BASE_PATH}/issue`, {
      businessId,
      permitType,
      issuedDate: new Date().toISOString()
    })
    return response
  } catch (error) {
    console.error('Permit issuance failed:', error)
    throw error
  }
}

/**
 * Get permit details
 * @param {string} permitId - Permit ID
 * @returns {Promise<object>} Permit data
 */
export async function getPermit(permitId) {
  return get(`${BASE_PATH}/${permitId}`)
}

/**
 * Get all permits for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} List of permits
 */
export async function getBusinessPermits(businessId) {
  const response = await get(`${BASE_PATH}?businessId=${businessId}`)
  return Array.isArray(response) ? response : response?.permits || []
}

/**
 * Download permit PDF
 * @param {string} permitId - Permit ID
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadPermitPDF(permitId) {
  try {
    // Get token from auth session (same as http.js fetchWithFallback)
    let current = getCurrentUser()
    if (!current) {
      try {
        let raw = localStorage.getItem('auth__currentUser')
        if (!raw) raw = sessionStorage.getItem('auth__sessionUser')
        if (raw) {
          const parsed = JSON.parse(raw)
          current = parsed.user || parsed
        }
      } catch { /* ignore */ }
    }
    const token = current?.token

    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`/api/business/permits/${permitId}/download`, {
      method: 'GET',
      credentials: 'include',
      headers
    })
    
    if (!response.ok) {
      throw new Error('Failed to download permit')
    }
    
    return await response.blob()
  } catch (error) {
    console.error('Permit download failed:', error)
    throw error
  }
}

/**
 * Verify permit authenticity
 * @param {string} permitNumber - Permit number
 * @returns {Promise<object>} Verification result
 */
export async function verifyPermit(permitNumber) {
  return get(`${BASE_PATH}/verify/${permitNumber}`)
}

/**
 * Generate permit PDF locally (fallback if backend fails)
 * @param {object} permitData - Permit data
 * @returns {Promise<Blob>} PDF blob
 */
export async function generatePermitPDFLocally(permitData) {
  // This would use a library like jsPDF or pdfmake
  // For now, return a placeholder
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .permit-number { font-size: 24px; font-weight: bold; color: #1890ff; }
        .business-info { margin: 20px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MAYOR'S PERMIT</h1>
        <p>City of Alaminos, Pangasinan</p>
        <div class="permit-number">${permitData.permitNumber}</div>
      </div>
      <div class="business-info">
        <p><strong>Business Name:</strong> ${permitData.businessName}</p>
        <p><strong>Owner:</strong> ${permitData.ownerName}</p>
        <p><strong>Address:</strong> ${permitData.address}</p>
        <p><strong>Line of Business:</strong> ${permitData.lineOfBusiness}</p>
        <p><strong>Issued Date:</strong> ${new Date(permitData.issuedDate).toLocaleDateString()}</p>
        <p><strong>Expiry Date:</strong> ${new Date(permitData.expiryDate).toLocaleDateString()}</p>
      </div>
      <div class="qr-code">
        <img src="${permitData.qrCode}" alt="QR Code" />
        <p>Scan to verify authenticity</p>
      </div>
    </body>
    </html>
  `
  
  const blob = new Blob([html], { type: 'text/html' })
  return blob
}

/**
 * Calculate permit expiry date
 * @param {Date} issuedDate - Issued date
 * @param {string} permitType - Permit type
 * @returns {Date} Expiry date
 */
export function calculateExpiryDate(issuedDate = new Date(), _permitType = 'initial') {
  const issued = new Date(issuedDate)
  const expiry = new Date(issued)

  // Permits valid for 1 year
  expiry.setFullYear(expiry.getFullYear() + 1)

  return expiry
}

/**
 * Check if permit is valid
 * @param {object} permit - Permit data
 * @returns {boolean} True if valid
 */
export function isPermitValid(permit) {
  if (!permit || !permit.expiryDate) return false
  
  const now = new Date()
  const expiry = new Date(permit.expiryDate)
  
  return now < expiry && permit.status === 'active'
}

/**
 * Get permit status color
 * @param {object} permit - Permit data
 * @returns {string} Ant Design color
 */
export function getPermitStatusColor(permit) {
  if (!permit) return 'default'
  
  if (permit.status === 'active' && isPermitValid(permit)) {
    return 'success'
  } else if (permit.status === 'expired') {
    return 'error'
  } else if (permit.status === 'suspended') {
    return 'warning'
  } else if (permit.status === 'revoked') {
    return 'error'
  }
  
  return 'default'
}

export default {
  generatePermitNumber,
  generatePermitQRCode,
  issuePermit,
  getPermit,
  getBusinessPermits,
  downloadPermitPDF,
  verifyPermit,
  generatePermitPDFLocally,
  calculateExpiryDate,
  isPermitValid,
  getPermitStatusColor
}
