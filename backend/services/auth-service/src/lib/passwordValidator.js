/**
 * Password Strength Validator
 * Validates password strength according to security requirements
 */

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
  const errors = []
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] }
  }

  // Minimum length: 12 characters (security requirement)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Must contain at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Must contain at least one special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Maximum length: 200 characters (prevent DoS)
  if (password.length > 200) {
    errors.push('Password must be no more than 200 characters long')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if password is in history (prevent reuse)
 * @param {string} passwordHash - New password hash to check
 * @param {string[]} passwordHistory - Array of previous password hashes
 * @param {number} maxHistory - Maximum number of passwords to check (default: 5)
 * @returns {boolean} - True if password is in history
 */
function isPasswordInHistory(passwordHash, passwordHistory = [], maxHistory = 5) {
  if (!passwordHash || !Array.isArray(passwordHistory)) {
    return false
  }
  
  // Check last maxHistory passwords
  const recentHistory = passwordHistory.slice(-maxHistory)
  return recentHistory.includes(passwordHash)
}

module.exports = {
  validatePasswordStrength,
  isPasswordInHistory,
}
