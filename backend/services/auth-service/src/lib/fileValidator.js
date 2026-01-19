const fs = require('fs').promises
const path = require('path')

/**
 * File Upload Validation
 * Validates file uploads for ID documents and other secure files
 */

// Allowed file types for ID uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

/**
 * Validate image file
 * @param {object} file - File object (from multer or similar)
 * @param {object} options - Validation options
 * @param {number} options.maxSize - Max file size in bytes (default: 5MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateImageFile(file, options = {}) {
  const maxSize = options.maxSize || MAX_FILE_SIZE
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  // Check file size
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0)
  if (fileSize === 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    return { valid: false, error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` }
  }

  // Check MIME type
  const mimeType = file.mimetype || file.type
  if (!mimeType || !allowedTypes.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // Check file extension
  const originalName = file.originalname || file.name || ''
  const ext = path.extname(originalName).toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Verify file content (basic check)
  // For images, check magic bytes
  if (file.buffer) {
    const isValidContent = await validateFileContent(file.buffer, mimeType)
    if (!isValidContent) {
      return { valid: false, error: 'File content does not match file type' }
    }
  } else if (file.path) {
    // If file is saved to disk, read first few bytes
    try {
      const buffer = await fs.readFile(file.path, { start: 0, end: 12 })
      const isValidContent = await validateFileContent(buffer, mimeType)
      if (!isValidContent) {
        return { valid: false, error: 'File content does not match file type' }
      }
    } catch (error) {
      return { valid: false, error: 'Unable to read file for validation' }
    }
  }

  return { valid: true }
}

/**
 * Validate file content by checking magic bytes
 * @param {Buffer} buffer - File buffer (first 12 bytes)
 * @param {string} mimeType - Expected MIME type
 * @returns {Promise<boolean>}
 */
async function validateFileContent(buffer, mimeType) {
  if (!buffer || buffer.length < 4) {
    return false
  }

  const mime = mimeType.toLowerCase()

  // JPEG: FF D8 FF
  if (mime.includes('jpeg') || mime.includes('jpg')) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime.includes('png')) {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
  }

  // PDF: %PDF
  if (mime.includes('pdf')) {
    const pdfHeader = buffer.toString('ascii', 0, 4)
    return pdfHeader === '%PDF'
  }

  // If we can't validate, allow it (will be caught by other checks)
  return true
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} - File extension (with dot)
 */
function getExtensionFromMimeType(mimeType) {
  const mime = mimeType.toLowerCase()
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'
  if (mime.includes('png')) return '.png'
  if (mime.includes('pdf')) return '.pdf'
  return '.bin'
}

module.exports = {
  validateImageFile,
  validateFileContent,
  getExtensionFromMimeType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
}
