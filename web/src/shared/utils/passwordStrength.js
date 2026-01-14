/**
 * Password strength calculation and validation utilities
 */

/**
 * Calculate password strength score (0-4)
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score (0-4)
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0
  
  let score = 0
  
  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // Character type checks
  if (/[a-z]/.test(password)) score++ // lowercase
  if (/[A-Z]/.test(password)) score++ // uppercase
  if (/\d/.test(password)) score++ // number
  if (/[^A-Za-z0-9]/.test(password)) score++ // special character
  
  // Cap at 4
  return Math.min(score, 4)
}

/**
 * Get password strength level
 * @param {string} password - Password to evaluate
 * @returns {{level: 'weak'|'fair'|'good'|'strong', score: number, color: string}}
 */
export function getPasswordStrength(password) {
  const score = calculatePasswordStrength(password)
  
  if (score <= 2) {
    return { level: 'weak', score, color: '#ff4d4f' }
  } else if (score === 3) {
    return { level: 'fair', score, color: '#faad14' }
  } else if (score === 4) {
    return { level: 'good', score, color: '#52c41a' }
  } else {
    return { level: 'strong', score, color: '#52c41a' }
  }
}

/**
 * Check if password meets all requirements
 * @param {string} password - Password to check
 * @returns {{valid: boolean, checks: {length: boolean, lowercase: boolean, uppercase: boolean, number: boolean, special: boolean}}}
 */
export function validatePasswordRequirements(password) {
  if (!password) {
    return {
      valid: false,
      checks: {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false
      }
    }
  }
  
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }
  
  return {
    valid: Object.values(checks).every(check => check === true),
    checks
  }
}

/**
 * Get requirement labels
 */
export const REQUIREMENT_LABELS = {
  length: 'At least 8 characters',
  lowercase: 'One lowercase letter',
  uppercase: 'One uppercase letter',
  number: 'One number',
  special: 'One special character'
}
