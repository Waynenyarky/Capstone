const { requestVerification, verifyCode, checkVerificationStatus } = require('../../services/auth-service/src/lib/verificationService')
const { signAccessToken } = require('../../services/auth-service/src/middleware/auth')

/**
 * Request verification and get the code (for test purposes)
 * In test/dev mode, codes are logged to console or stored in memory
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @param {string} method - Verification method ('otp' or 'mfa')
 * @returns {Promise<{success: boolean, code?: string, result: object}>}
 */
async function requestVerificationAndGetCode(userId, purpose, method = 'otp') {
  const result = await requestVerification(userId, method, purpose)
  
  if (!result.success) {
    return { success: false, result }
  }

  // In test mode, we can check the verification status to get the code
  // Note: This depends on how verificationService stores codes in test mode
  const status = await checkVerificationStatus(userId, purpose)
  
  // If code is available in status (test/dev mode), return it
  // Otherwise, tests should use the verification status to verify
  return {
    success: true,
    code: status.code || undefined, // May not be available in all test scenarios
    result,
    status,
  }
}

/**
 * Complete login flow for a user (helper for integration tests)
 * @param {User} user - User object
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: object}>}
 */
async function loginAsUser(user, password) {
  // This is a simplified login helper
  // For full login flow, use the actual login endpoints
  const token = signAccessToken(user).token
  return {
    token,
    user: {
      id: String(user._id),
      email: user.email,
      role: user.role?.slug || '',
    },
  }
}

/**
 * Create an authenticated supertest request
 * @param {Function} request - Supertest request function
 * @param {string} token - JWT token
 * @returns {Function} Authenticated request function
 */
function createAuthenticatedRequest(request, token) {
  return (method, path) => {
    return request(method, path).set('Authorization', `Bearer ${token}`)
  }
}

module.exports = {
  requestVerificationAndGetCode,
  loginAsUser,
  createAuthenticatedRequest,
}
