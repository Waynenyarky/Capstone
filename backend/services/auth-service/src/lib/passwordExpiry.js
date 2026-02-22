/**
 * 90-day user password expiry (IAS / security policy).
 * When password is older than PASSWORD_EXPIRY_DAYS, user must change password on next login.
 */

const PASSWORD_EXPIRY_DAYS = 90
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Check if the user's password is expired based on passwordChangedAt.
 * If passwordChangedAt is null/undefined (legacy users), treat as expired so they must change once.
 * @param {Date|string|null|undefined} passwordChangedAt - When the password was last set
 * @returns {boolean} - True if password has expired and user must change it
 */
function isPasswordExpired(passwordChangedAt) {
  if (passwordChangedAt == null) return true
  const changed = new Date(passwordChangedAt).getTime()
  if (Number.isNaN(changed)) return true
  const cutoff = Date.now() - PASSWORD_EXPIRY_DAYS * MS_PER_DAY
  return changed < cutoff
}

/**
 * Get expiry config (for tests or config exposure).
 */
function getPasswordExpiryDays() {
  return PASSWORD_EXPIRY_DAYS
}

module.exports = {
  PASSWORD_EXPIRY_DAYS,
  isPasswordExpired,
  getPasswordExpiryDays,
}
