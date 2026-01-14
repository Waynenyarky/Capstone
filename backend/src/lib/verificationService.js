const mongoose = require('mongoose')
const { generateCode } = require('./codes')
const { sendOtp } = require('./mailer')
const { verifyTotpWithCounter } = require('./totp')
const { decryptWithHash } = require('./secretCipher')
const { checkLockout, incrementFailedAttempts, clearFailedAttempts } = require('./accountLockout')
const User = require('../models/User')

/**
 * Unified Verification Service
 * Handles both OTP (email) and MFA (TOTP/authenticator) verification
 */

// In-memory store for verification requests (fallback if DB unavailable)
const verificationRequests = new Map()

// Verification request TTL (10 minutes)
const VERIFICATION_TTL_MS = 10 * 60 * 1000

/**
 * Request verification (OTP or MFA)
 * @param {string|ObjectId} userId - User ID
 * @param {string} method - Verification method: 'otp' or 'mfa'
 * @param {string} purpose - Purpose of verification (e.g., 'email_change', 'password_change')
 * @returns {Promise<{success: boolean, code?: string, error?: string, expiresAt?: Date}>}
 */
async function requestVerification(userId, method = 'otp', purpose = 'profile_change') {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if account is locked
    const lockoutStatus = await checkLockout(userId)
    if (lockoutStatus.locked) {
      return {
        success: false,
        error: 'Account is locked due to too many failed attempts',
        lockedUntil: lockoutStatus.lockedUntil,
        remainingMinutes: lockoutStatus.remainingMinutes,
      }
    }

    if (method === 'mfa') {
      // MFA verification - user provides code from authenticator app
      if (!user.mfaEnabled || !user.mfaSecret) {
        return { success: false, error: 'MFA is not enabled for this account' }
      }
      // For MFA, we don't send a code - user uses their authenticator app
      return {
        success: true,
        method: 'mfa',
        message: 'Please enter the code from your authenticator app',
      }
    }

    // OTP verification - send code via email
    const code = generateCode()
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS)

    // Store verification request
    const key = `${userId}_${purpose}`
    const useDB = mongoose.connection && mongoose.connection.readyState === 1

    if (useDB) {
      // Use MongoDB for persistence (create VerificationRequest model if needed)
      // For now, use in-memory store
      verificationRequests.set(key, {
        userId: String(userId),
        code,
        expiresAt: expiresAt.getTime(),
        method,
        purpose,
        verified: false,
      })
    } else {
      verificationRequests.set(key, {
        userId: String(userId),
        code,
        expiresAt: expiresAt.getTime(),
        method,
        purpose,
        verified: false,
      })
    }

    // Send OTP via email
    try {
      await sendOtp({
        to: user.email,
        code,
        subject: `Verification code for ${purpose.replace(/_/g, ' ')}`,
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return { success: false, error: 'Failed to send verification code' }
    }

    return {
      success: true,
      method: 'otp',
      expiresAt,
      // Include dev code in non-production
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    }
  } catch (error) {
    console.error('Error requesting verification:', error)
    return { success: false, error: error.message || 'Failed to request verification' }
  }
}

/**
 * Verify code (OTP or MFA)
 * @param {string|ObjectId} userId - User ID
 * @param {string} code - Verification code
 * @param {string} method - Verification method: 'otp' or 'mfa'
 * @param {string} purpose - Purpose of verification
 * @returns {Promise<{success: boolean, verified: boolean, error?: string}>}
 */
async function verifyCode(userId, code, method = 'otp', purpose = 'profile_change') {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return { success: false, verified: false, error: 'User not found' }
    }

    // Check if account is locked
    const lockoutStatus = await checkLockout(userId)
    if (lockoutStatus.locked) {
      return {
        success: false,
        verified: false,
        error: 'Account is locked. Please try again later.',
        lockedUntil: lockoutStatus.lockedUntil,
        remainingMinutes: lockoutStatus.remainingMinutes,
      }
    }

    if (method === 'mfa') {
      // MFA verification using TOTP
      if (!user.mfaEnabled || !user.mfaSecret) {
        return { success: false, verified: false, error: 'MFA is not enabled' }
      }

      try {
        const secretPlain = decryptWithHash(user.passwordHash, user.mfaSecret)
        const verifyResult = verifyTotpWithCounter({
          secret: secretPlain,
          token: String(code),
          window: 1,
          period: 30,
          digits: 6,
        })

        if (!verifyResult.ok) {
          // Increment failed attempts
          await incrementFailedAttempts(userId)
          return { success: true, verified: false, error: 'Invalid verification code' }
        }

        // Check for replay attack
        if (
          typeof user.mfaLastUsedTotpCounter === 'number' &&
          user.mfaLastUsedTotpCounter === verifyResult.counter
        ) {
          await incrementFailedAttempts(userId)
          return { success: true, verified: false, error: 'Verification code already used' }
        }

        // Update last used counter
        user.mfaLastUsedTotpCounter = verifyResult.counter
        user.mfaLastUsedTotpAt = new Date()
        await user.save()

        // Clear failed attempts on success
        await clearFailedAttempts(userId)

        return { success: true, verified: true }
      } catch (error) {
        console.error('MFA verification error:', error)
        await incrementFailedAttempts(userId)
        return { success: false, verified: false, error: 'MFA verification failed' }
      }
    }

    // OTP verification
    const key = `${userId}_${purpose}`
    const request = verificationRequests.get(key)

    if (!request) {
      await incrementFailedAttempts(userId)
      return { success: false, verified: false, error: 'No verification request found' }
    }

    if (request.verified) {
      await incrementFailedAttempts(userId)
      return { success: false, verified: false, error: 'Verification code already used' }
    }

    if (Date.now() > request.expiresAt) {
      verificationRequests.delete(key)
      await incrementFailedAttempts(userId)
      return { success: false, verified: false, error: 'Verification code expired' }
    }

    if (String(request.code) !== String(code)) {
      await incrementFailedAttempts(userId)
      return { success: false, verified: false, error: 'Invalid verification code' }
    }

    // Verification successful
    request.verified = true
    verificationRequests.set(key, request)

    // Clear failed attempts on success
    await clearFailedAttempts(userId)

    // Clean up after 5 minutes (allow some time for the change to complete)
    setTimeout(() => {
      verificationRequests.delete(key)
    }, 5 * 60 * 1000)

    return { success: true, verified: true }
  } catch (error) {
    console.error('Error verifying code:', error)
    await incrementFailedAttempts(userId)
    return { success: false, verified: false, error: error.message || 'Verification failed' }
  }
}

/**
 * Check if verification is pending for a user
 * @param {string|ObjectId} userId - User ID
 * @param {string} purpose - Purpose of verification
 * @returns {Promise<{pending: boolean, expiresAt?: Date}>}
 */
async function checkVerificationStatus(userId, purpose = 'profile_change') {
  const key = `${userId}_${purpose}`
  const request = verificationRequests.get(key)

  if (!request) {
    return { pending: false }
  }

  if (request.verified) {
    return { pending: false }
  }

  if (Date.now() > request.expiresAt) {
    verificationRequests.delete(key)
    return { pending: false }
  }

  return {
    pending: true,
    expiresAt: new Date(request.expiresAt),
    method: request.method,
  }
}

/**
 * Clear verification request
 * @param {string|ObjectId} userId - User ID
 * @param {string} purpose - Purpose of verification
 */
function clearVerificationRequest(userId, purpose = 'profile_change') {
  const key = `${userId}_${purpose}`
  verificationRequests.delete(key)
}

module.exports = {
  requestVerification,
  verifyCode,
  checkVerificationStatus,
  clearVerificationRequest,
}
