/**
 * Phone number formatting utilities
 */

/**
 * Format phone number as user types (09XXXXXXXXX format)
 * @param {string} value - Raw phone number input
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(value) {
  if (!value) return ''
  
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 11 digits
  const limited = numbers.slice(0, 11)
  
  // Ensure it starts with 09
  if (limited.length > 0 && limited[0] !== '0') {
    return '0' + limited.slice(0, 10)
  }
  
  return limited
}

/**
 * Format phone number for display (09XX XXX XXXX)
 * @param {string} value - Phone number
 * @returns {string} - Formatted display string
 */
export function formatPhoneDisplay(value) {
  if (!value) return ''
  
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 2)} ${numbers.slice(2)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 6)} ${numbers.slice(6)}`
  } else {
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 6)} ${numbers.slice(6, 10)} ${numbers.slice(10)}`
  }
}

/**
 * Validate phone number format
 * @param {string} value - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function isValidPhoneFormat(value) {
  if (!value) return false
  const numbers = value.replace(/\D/g, '')
  return numbers.length === 11 && numbers.startsWith('09')
}
