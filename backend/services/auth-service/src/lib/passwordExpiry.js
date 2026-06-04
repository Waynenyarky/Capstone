/**
 * 90-day user password expiry (IAS / security policy).
 * When password is older than PASSWORD_EXPIRY_DAYS, user must change password on next login.
 */

const PASSWORD_EXPIRY_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Check if the user's password is expired based on passwordChangedAt.
 * If passwordChangedAt is null/undefined (legacy users), treat as expired so they must change once.
 * @param {Date|string|null|undefined} passwordChangedAt - When the password was last set
 * @returns {boolean} - True if password has expired and user must change it
 */
function isPasswordExpired(passwordChangedAt) {
  if (passwordChangedAt == null) return true;
  const changed = new Date(passwordChangedAt).getTime();
  if (Number.isNaN(changed)) return true;
  const cutoff = Date.now() - PASSWORD_EXPIRY_DAYS * MS_PER_DAY;
  return changed < cutoff;
}

/**
 * True only when the password is expired due to the 90-day policy (passwordChangedAt is set and older than 90 days).
 * Returns false for null/undefined (first-time or temporary password) so the UI does not show "90-day policy" for new accounts.
 * Use this for the passwordExpired flag in API responses (user-facing message). Use isPasswordExpired() for forcing mustChangeCredentials.
 * @param {Date|string|null|undefined} passwordChangedAt - When the password was last set
 * @returns {boolean} - True if password has expired due to 90-day policy only
 */
function isPasswordExpiredByPolicy(passwordChangedAt) {
  if (passwordChangedAt == null) return false;
  const changed = new Date(passwordChangedAt).getTime();
  if (Number.isNaN(changed)) return false;
  const cutoff = Date.now() - PASSWORD_EXPIRY_DAYS * MS_PER_DAY;
  return changed < cutoff;
}

/**
 * Get expiry config (for tests or config exposure).
 */
function getPasswordExpiryDays() {
  return PASSWORD_EXPIRY_DAYS;
}

module.exports = {
  PASSWORD_EXPIRY_DAYS,
  isPasswordExpired,
  isPasswordExpiredByPolicy,
  getPasswordExpiryDays,
};
