/**
 * Data Masking Utility
 * Masks sensitive data in audit logs and responses
 */

/**
 * Mask sensitive data in audit log
 * @param {object} auditLog - Audit log object
 * @returns {object} - Masked audit log
 */
function maskSensitiveData(auditLog) {
  if (!auditLog) return auditLog

  const masked = { ...auditLog }

  // Mask password fields
  if (masked.fieldChanged === 'password') {
    masked.oldValue = '[REDACTED]'
    masked.newValue = '[REDACTED]'
  }

  // Mask email if it's sensitive
  if (masked.fieldChanged === 'email' && process.env.MASK_EMAIL_IN_AUDIT === 'true') {
    masked.oldValue = maskEmail(masked.oldValue)
    masked.newValue = maskEmail(masked.newValue)
  }

  // Mask sensitive fields in metadata
  if (masked.metadata) {
    const safeMetadata = { ...masked.metadata }
    
    // Remove password hashes
    if (safeMetadata.newPasswordHash) {
      safeMetadata.newPasswordHash = '[REDACTED]'
    }
    if (safeMetadata.passwordHash) {
      safeMetadata.passwordHash = '[REDACTED]'
    }

    // Mask API keys or tokens if present
    if (safeMetadata.apiKey) {
      safeMetadata.apiKey = '[REDACTED]'
    }
    if (safeMetadata.token) {
      safeMetadata.token = '[REDACTED]'
    }

    masked.metadata = safeMetadata
  }

  return masked
}

/**
 * Mask email address (show only first 2 chars and domain)
 * @param {string} email - Email address
 * @returns {string} - Masked email
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return email
  
  const [localPart, domain] = email.split('@')
  if (!domain) return email

  if (localPart.length <= 2) {
    return `${localPart}@${domain}`
  }

  const maskedLocal = localPart.substring(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 4))
  return `${maskedLocal}@${domain}`
}

/**
 * Mask phone number (show only last 4 digits)
 * @param {string} phoneNumber - Phone number
 * @returns {string} - Masked phone number
 */
function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber
  
  if (phoneNumber.length <= 4) {
    return '*'.repeat(phoneNumber.length)
  }

  return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4)
}

/**
 * Mask ID number (show only last 4 characters)
 * @param {string} idNumber - ID number
 * @returns {string} - Masked ID number
 */
function maskIdNumber(idNumber) {
  if (!idNumber || typeof idNumber !== 'string') return idNumber
  
  if (idNumber.length <= 4) {
    return '*'.repeat(idNumber.length)
  }

  return '*'.repeat(idNumber.length - 4) + idNumber.slice(-4)
}

/**
 * Mask credit card number (show only last 4 digits)
 * @param {string} cardNumber - Credit card number
 * @returns {string} - Masked card number
 */
function maskCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return cardNumber
  
  const cleaned = cardNumber.replace(/\s/g, '')
  if (cleaned.length <= 4) {
    return '*'.repeat(cleaned.length)
  }

  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4)
}

module.exports = {
  maskSensitiveData,
  maskEmail,
  maskPhoneNumber,
  maskIdNumber,
  maskCardNumber,
}
