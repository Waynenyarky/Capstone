/**
 * Centralized error message mapping for user-friendly error messages
 */

const ERROR_PATTERNS = {
  // Phone number errors
  phone: {
    patterns: [/phone.*invalid/i, /phone.*format/i, /invalid.*phone/i],
    message: 'Please enter a valid phone number in the format 09XXXXXXXXX',
    field: 'phoneNumber'
  },
  
  // Name errors
  firstNameRequired: {
    patterns: [/first.*name.*required/i, /first name is required/i],
    message: 'First name is required',
    field: 'firstName'
  },
  lastNameRequired: {
    patterns: [/last.*name.*required/i, /last name is required/i],
    message: 'Last name is required',
    field: 'lastName'
  },
  
  // Password errors
  passwordWeak: {
    patterns: [/password.*weak/i, /password.*strength/i],
    message: 'Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, number, and special character.',
    field: 'password'
  },
  passwordHistory: {
    patterns: [/password.*history/i, /recently.*used/i, /password.*reuse/i],
    message: 'This password was recently used. Please choose a different password.',
    field: 'password'
  },
  passwordRequired: {
    patterns: [/password.*required/i],
    message: 'Password is required',
    field: 'password'
  },
  
  // Rate limiting
  rateLimit: {
    patterns: [/rate.*limit/i, /too.*many.*requests/i, /try.*again.*later/i],
    message: 'Too many requests. Please wait a moment and try again.',
    field: null
  },
  
  // Account lockout
  accountLocked: {
    patterns: [/account.*locked/i, /temporarily.*locked/i],
    message: 'Your account has been temporarily locked due to multiple failed attempts. Please try again later.',
    field: null
  },
  
  // Session/Token errors
  sessionInvalid: {
    patterns: [/session.*invalid/i, /token.*invalid/i, /unauthorized/i],
    message: 'Your session has expired. Please log in again.',
    field: null
  },
  
  // Email errors
  emailInvalid: {
    patterns: [/email.*invalid/i, /invalid.*email/i],
    message: 'Please enter a valid email address',
    field: 'email'
  },
  emailExists: {
    patterns: [/email.*exists/i, /email.*already/i, /email.*taken/i],
    message: 'This email address is already in use',
    field: 'email'
  },
  
  // Verification errors
  verificationFailed: {
    patterns: [/verification.*failed/i, /invalid.*code/i, /code.*incorrect/i],
    message: 'Verification code is incorrect. Please try again.',
    field: 'verificationCode'
  },
  verificationExpired: {
    patterns: [/verification.*expired/i, /code.*expired/i],
    message: 'Verification code has expired. Please request a new one.',
    field: 'verificationCode'
  },
  
  // File upload errors
  fileTooLarge: {
    patterns: [/file.*too.*large/i, /size.*exceeded/i],
    message: 'File size is too large. Please upload a smaller file.',
    field: null
  },
  fileInvalidType: {
    patterns: [/invalid.*file.*type/i, /file.*type.*not.*allowed/i],
    message: 'File type is not allowed. Please upload a supported file type.',
    field: null
  },
  
  // Generic
  generic: {
    patterns: [],
    message: 'An error occurred. Please try again.',
    field: null
  }
}

/**
 * Parse error message and return user-friendly error info
 * @param {Error|string} error - Error object or error message string
 * @returns {{message: string, field: string|null}}
 */
export function parseErrorMessage(error) {
  const errorMessage = error?.message || error?.toString() || String(error || '')
  const lowerMessage = errorMessage.toLowerCase()
  
  // Check each error pattern
  for (const [key, config] of Object.entries(ERROR_PATTERNS)) {
    if (key === 'generic') continue
    
    for (const pattern of config.patterns) {
      if (pattern.test(lowerMessage)) {
        return {
          message: config.message,
          field: config.field,
          type: key
        }
      }
    }
  }
  
  // Return generic error if no pattern matches
  return {
    message: ERROR_PATTERNS.generic.message,
    field: null,
    type: 'generic'
  }
}

/**
 * Set form field error based on parsed error
 * @param {FormInstance} form - Ant Design form instance
 * @param {Error|string} error - Error object or message
 */
export function setFormError(form, error) {
  const { message, field } = parseErrorMessage(error)
  
  if (field && form) {
    form.setFields([{ name: field, errors: [message] }])
  }
  
  return { message, field }
}

/**
 * Get user-friendly error message without setting form field
 * @param {Error|string} error - Error object or message
 * @returns {string}
 */
export function getErrorMessage(error) {
  return parseErrorMessage(error).message
}
