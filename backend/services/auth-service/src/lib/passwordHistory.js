const bcrypt = require('bcryptjs')
const { isPasswordInHistory } = require('./passwordValidator')

/**
 * Password History Management
 * Handles password history to prevent password reuse
 */

const MAX_PASSWORD_HISTORY = 5

/**
 * Check if new password is in history
 * @param {string} newPassword - Plain text new password
 * @param {string[]} passwordHistory - Array of previous password hashes
 * @returns {Promise<{inHistory: boolean}>}
 */
async function checkPasswordHistory(newPassword, passwordHistory = []) {
  if (!newPassword || !Array.isArray(passwordHistory)) {
    return { inHistory: false }
  }

  // Hash the new password to compare with history
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  // Check if this hash (or similar) is in history
  // Note: We need to compare with existing hashes, not create new ones
  // So we'll check if any hash in history matches when we compare
  for (const oldHash of passwordHistory.slice(-MAX_PASSWORD_HISTORY)) {
    try {
      // Compare new password with old hash
      const matches = await bcrypt.compare(newPassword, oldHash)
      if (matches) {
        return { inHistory: true }
      }
    } catch (error) {
      // Invalid hash in history, skip it
      console.warn('Invalid password hash in history:', error)
    }
  }

  return { inHistory: false }
}

/**
 * Add password to history
 * @param {string} passwordHash - New password hash to add
 * @param {string[]} currentHistory - Current password history array
 * @returns {string[]} - Updated password history (max MAX_PASSWORD_HISTORY entries)
 */
function addToPasswordHistory(passwordHash, currentHistory = []) {
  if (!passwordHash) {
    return currentHistory || []
  }

  const history = Array.isArray(currentHistory) ? [...currentHistory] : []

  // Add new hash to end
  history.push(passwordHash)

  // Keep only last MAX_PASSWORD_HISTORY entries
  if (history.length > MAX_PASSWORD_HISTORY) {
    return history.slice(-MAX_PASSWORD_HISTORY)
  }

  return history
}

module.exports = {
  checkPasswordHistory,
  addToPasswordHistory,
  MAX_PASSWORD_HISTORY,
}
