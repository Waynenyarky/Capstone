/**
 * AI Verification Service
 * 
 * Calls the AI microservice to verify ID documents.
 * 
 * IMPORTANT: This service does NOT verify IDs against any government database.
 * All verification is based on visual appearance classification only.
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3005'
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10)
const LEGIT_THRESHOLD = parseFloat(process.env.AI_LEGIT_THRESHOLD || '0.7')

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if the AI service is available
 * @returns {Promise<boolean>} True if the service is healthy
 */
async function isServiceAvailable() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    })
    return response.data.status === 'healthy'
  } catch (error) {
    console.error('[AIVerificationService] Health check failed:', error.message)
    return false
  }
}

/**
 * Get model information from the AI service
 * @returns {Promise<object|null>} Model info or null if unavailable
 */
async function getModelInfo() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/id-verification/model-info`, {
      timeout: 5000
    })
    return response.data
  } catch (error) {
    console.error('[AIVerificationService] Failed to get model info:', error.message)
    return null
  }
}

/**
 * Convert a local file path to base64
 * @param {string} filePath - Path to the file
 * @returns {Promise<string|null>} Base64 encoded string or null
 */
async function fileToBase64(filePath) {
  try {
    // Handle relative paths
    let absolutePath = filePath
    if (!path.isAbsolute(filePath)) {
      // If it's a URL-like path (e.g., /uploads/...), resolve from uploads directory
      if (filePath.startsWith('/uploads/')) {
        absolutePath = path.join(__dirname, '../..', filePath)
      } else {
        absolutePath = path.join(process.cwd(), filePath)
      }
    }

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[AIVerificationService] File not found: ${absolutePath}`)
      return null
    }

    const fileBuffer = fs.readFileSync(absolutePath)
    const base64 = fileBuffer.toString('base64')
    
    // Detect MIME type from extension
    const ext = path.extname(absolutePath).toLowerCase()
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }
    const mimeType = mimeTypes[ext] || 'image/jpeg'
    
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error(`[AIVerificationService] Failed to read file ${filePath}:`, error.message)
    return null
  }
}

/**
 * Determine if a URL is accessible by the AI service
 * @param {string} url - URL to check
 * @returns {boolean} True if the URL is accessible
 */
function isAccessibleUrl(url) {
  if (!url) return false
  
  // Check if it's a full HTTP(S) URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }
  
  // Local file paths are not directly accessible
  return false
}

/**
 * Verify ID document images
 * 
 * IMPORTANT: This verification is based on visual appearance only.
 * No government database verification is performed.
 * 
 * @param {object} options - Verification options
 * @param {string} options.frontImageUrl - URL or path to the front image
 * @param {string} options.backImageUrl - URL or path to the back image (optional)
 * @returns {Promise<object>} Verification result
 */
async function verifyIdImages({ frontImageUrl, backImageUrl }) {
  const result = {
    legit: null,
    confidence: 0,
    documentType: null,
    checkedAt: new Date(),
    modelVersion: '',
    status: 'pending',
    notes: [
      'Verification based on visual appearance only.',
      'No government database verification performed.'
    ]
  }

  // Check if AI service is available
  const serviceAvailable = await isServiceAvailable()
  if (!serviceAvailable) {
    console.warn('[AIVerificationService] AI service not available, marking as pending')
    result.status = 'pending'
    result.notes.push('AI service unavailable - verification pending.')
    return result
  }

  try {
    // Prepare request body
    const requestBody = {}

    // Handle front image
    if (frontImageUrl) {
      if (isAccessibleUrl(frontImageUrl)) {
        requestBody.frontImageUrl = frontImageUrl
      } else {
        // Convert local file to base64
        const base64 = await fileToBase64(frontImageUrl)
        if (base64) {
          requestBody.frontImageBase64 = base64
        } else {
          result.status = 'error'
          result.notes.push('Failed to read front image file.')
          return result
        }
      }
    } else {
      result.status = 'error'
      result.notes.push('No front image provided.')
      return result
    }

    // Handle back image if provided
    if (backImageUrl) {
      if (isAccessibleUrl(backImageUrl)) {
        requestBody.backImageUrl = backImageUrl
      } else {
        const base64 = await fileToBase64(backImageUrl)
        if (base64) {
          requestBody.backImageBase64 = base64
        }
        // Back image is optional, so we don't fail if it can't be read
      }
    }

    // Call AI service with retries
    let lastError = null
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AIVerificationService] Calling AI service (attempt ${attempt}/${MAX_RETRIES})`)
        
        const response = await axios.post(
          `${AI_SERVICE_URL}/id-verification/verify`,
          requestBody,
          {
            timeout: AI_SERVICE_TIMEOUT,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        // Process response
        const data = response.data
        
        result.legit = data.legit
        result.confidence = data.confidence
        result.documentType = data.documentType || null
        result.modelVersion = data.modelVersion || ''
        result.checkedAt = new Date()
        
        // Determine status based on confidence
        if (data.legit && data.confidence >= LEGIT_THRESHOLD) {
          result.status = 'verified'
        } else if (data.legit === false) {
          result.status = 'failed'
          result.notes.push('ID document did not pass visual verification.')
        } else {
          result.status = 'needs_review'
          result.notes.push('Verification confidence is low - manual review recommended.')
        }

        // Add any notes from the AI service
        if (data.notes && Array.isArray(data.notes)) {
          result.notes.push(...data.notes)
        }

        console.log(`[AIVerificationService] Verification complete: legit=${result.legit}, confidence=${result.confidence}, status=${result.status}`)
        return result

      } catch (error) {
        lastError = error
        console.error(`[AIVerificationService] Attempt ${attempt} failed:`, error.message)
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt) // Exponential backoff
        }
      }
    }

    // All retries failed
    console.error('[AIVerificationService] All retry attempts failed:', lastError?.message)
    result.status = 'error'
    result.notes.push(`Verification failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`)
    return result

  } catch (error) {
    console.error('[AIVerificationService] Unexpected error:', error)
    result.status = 'error'
    result.notes.push(`Unexpected error: ${error.message}`)
    return result
  }
}

/**
 * Verify an owner's ID during business registration
 * 
 * @param {object} ownerIdentity - Owner identity data
 * @param {string} ownerIdentity.idFileUrl - URL/path to front of ID
 * @param {string} ownerIdentity.idFileBackUrl - URL/path to back of ID (optional)
 * @returns {Promise<object>} AI verification result
 */
async function verifyOwnerIdentity(ownerIdentity) {
  if (!ownerIdentity || !ownerIdentity.idFileUrl) {
    return {
      legit: null,
      confidence: 0,
      documentType: null,
      checkedAt: new Date(),
      modelVersion: '',
      status: 'pending',
      notes: ['No ID image provided for verification.']
    }
  }

  return verifyIdImages({
    frontImageUrl: ownerIdentity.idFileUrl,
    backImageUrl: ownerIdentity.idFileBackUrl
  })
}

module.exports = {
  isServiceAvailable,
  getModelInfo,
  verifyIdImages,
  verifyOwnerIdentity
}
