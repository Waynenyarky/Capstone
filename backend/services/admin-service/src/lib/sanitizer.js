/**
 * Input Sanitization Utilities
 * Prevents XSS attacks and sanitizes user inputs
 */

/**
 * Sanitize string input - remove potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return String(input || '')
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Remove script tags and event handlers (basic XSS prevention)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return ''
  }

  // Basic email sanitization
  let sanitized = email.toLowerCase().trim()

  // Remove any script tags or dangerous characters
  sanitized = sanitizeString(sanitized)

  // Basic email format validation (will be validated properly elsewhere)
  // Just ensure no obvious XSS vectors
  sanitized = sanitized.replace(/[<>\"']/g, '')

  return sanitized
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
function sanitizePhoneNumber(phone) {
  if (typeof phone !== 'string') {
    return ''
  }

  // Remove all non-digit characters except +, -, spaces, and parentheses
  let sanitized = phone.replace(/[^\d+\-() ]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Check if string contains SQL injection patterns
 * @param {string} input - Input to check
 * @returns {boolean} - True if SQL injection pattern detected
 */
function containsSqlInjection(input) {
  if (typeof input !== 'string') {
    return false
  }
  
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*(\d+\s*=\s*\d+|\'.*\'|\".*\")/i,
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bEXECUTE\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\'\s*OR\s*\'[^\']*\'[^=]*=\s*\'[^\']*)/i,
    /(\"\s*OR\s*\"[^\"]*\"[^=]*=\s*\"[^\"]*)/i,
    /(;\s*DROP\s+TABLE)/i,
    /(;\s*DELETE\s+FROM)/i,
    /(\'\s*;\s*--)/i,
    /(\'\s*OR\s*\'1\'=\'1)/i,
    /(\'\s*OR\s*\'1\'=\'1\'\s*--)/i,
    /(\'\s*;\s*DROP\s+TABLE)/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check if string contains XSS patterns
 * @param {string} input - Input to check
 * @returns {boolean} - True if XSS pattern detected
 */
function containsXss(input) {
  if (typeof input !== 'string') {
    return false
  }
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<img[^>]+onerror\s*=/gi,
    /<svg[^>]+onload\s*=/gi,
    /<body[^>]+onload\s*=/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^\s>]*/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitize name (first name, last name)
 * @param {string} name - Name to sanitize
 * @returns {string} - Sanitized name
 */
function sanitizeName(name) {
  if (typeof name !== 'string') {
    return ''
  }

  // Remove HTML tags and scripts
  let sanitized = sanitizeString(name)

  // Allow letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
  sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '')

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100)
  }

  return sanitized.trim()
}

/**
 * Sanitize ID number
 * @param {string} idNumber - ID number to sanitize
 * @returns {string} - Sanitized ID number
 */
function sanitizeIdNumber(idNumber) {
  if (typeof idNumber !== 'string') {
    return ''
  }

  // Remove HTML tags and scripts
  let sanitized = sanitizeString(idNumber)

  // Allow alphanumeric and common ID separators (hyphens, spaces)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-]/g, '')

  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50)
  }

  return sanitized.trim().toUpperCase()
}

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeName,
  sanitizeIdNumber,
  sanitizeObject,
  containsSqlInjection,
  containsXss,
}
