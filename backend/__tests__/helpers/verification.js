const { requestVerification, verifyCode, checkVerificationStatus, clearVerificationRequest } = require('../../services/auth-service/src/lib/verificationService')

/**
 * Request OTP verification for a user
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @returns {Promise<object>} Verification request result
 */
async function requestOTPVerification(userId, purpose) {
  return await requestVerification(userId, 'otp', purpose)
}

/**
 * Request MFA verification for a user
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @returns {Promise<object>} Verification request result
 */
async function requestMFAVerification(userId, purpose) {
  return await requestVerification(userId, 'mfa', purpose)
}

/**
 * Verify a code
 * @param {string} userId - User ID
 * @param {string} code - Verification code
 * @param {string} method - Verification method ('otp' or 'mfa')
 * @param {string} purpose - Verification purpose
 * @returns {Promise<object>} Verification result
 */
async function verifyVerificationCode(userId, code, method, purpose) {
  return await verifyCode(userId, code, method, purpose)
}

/**
 * Check verification status
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @returns {Promise<object>} Verification status
 */
async function getVerificationStatus(userId, purpose) {
  return await checkVerificationStatus(userId, purpose)
}

/**
 * Clear verification request
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @returns {void}
 */
function clearVerification(userId, purpose) {
  clearVerificationRequest(userId, purpose)
}

module.exports = {
  requestOTPVerification,
  requestMFAVerification,
  verifyVerificationCode,
  getVerificationStatus,
  clearVerification,
}
