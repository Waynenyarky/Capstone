const User = require('../models/User')

/**
 * Account Lockout Service
 * Handles account lockout after failed verification attempts
 */

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if account is currently locked
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<{locked: boolean, lockedUntil?: Date, remainingMinutes?: number}>}
 */
async function checkLockout(userId) {
  try {
    const user = await User.findById(userId).select('accountLockedUntil').lean()
    if (!user) {
      return { locked: false }
    }

    if (!user.accountLockedUntil) {
      return { locked: false }
    }

    const lockedUntil = new Date(user.accountLockedUntil)
    const now = new Date()

    if (now >= lockedUntil) {
      // Lockout period has expired, clear it
      await User.findByIdAndUpdate(userId, {
        accountLockedUntil: null,
        failedVerificationAttempts: 0,
        lastFailedAttemptAt: null,
      })
      return { locked: false }
    }

    const remainingMs = lockedUntil.getTime() - now.getTime()
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))

    return {
      locked: true,
      lockedUntil,
      remainingMinutes,
    }
  } catch (error) {
    console.error('Error checking account lockout:', error)
    return { locked: false }
  }
}

/**
 * Increment failed verification attempts and lock account if threshold reached
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<{locked: boolean, attempts: number, lockedUntil?: Date}>}
 */
async function incrementFailedAttempts(userId) {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return { locked: false, attempts: 0 }
    }

    // Check if already locked
    const lockoutCheck = await checkLockout(userId)
    if (lockoutCheck.locked) {
      return {
        locked: true,
        attempts: user.failedVerificationAttempts || 0,
        lockedUntil: user.accountLockedUntil,
      }
    }

    // Increment failed attempts
    const newAttempts = (user.failedVerificationAttempts || 0) + 1
    const now = new Date()

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock account
      const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)
      user.failedVerificationAttempts = newAttempts
      user.accountLockedUntil = lockedUntil
      user.lastFailedAttemptAt = now
      await user.save()

      return {
        locked: true,
        attempts: newAttempts,
        lockedUntil,
      }
    }

    // Just increment attempts
    user.failedVerificationAttempts = newAttempts
    user.lastFailedAttemptAt = now
    await user.save()

    return {
      locked: false,
      attempts: newAttempts,
    }
  } catch (error) {
    console.error('Error incrementing failed attempts:', error)
    return { locked: false, attempts: 0 }
  }
}

/**
 * Clear failed verification attempts (on successful verification)
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<void>}
 */
async function clearFailedAttempts(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      failedVerificationAttempts: 0,
      accountLockedUntil: null,
      lastFailedAttemptAt: null,
    })
  } catch (error) {
    console.error('Error clearing failed attempts:', error)
  }
}

/**
 * Manually unlock account (admin function)
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<void>}
 */
async function unlockAccount(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      failedVerificationAttempts: 0,
      accountLockedUntil: null,
      lastFailedAttemptAt: null,
    })
  } catch (error) {
    console.error('Error unlocking account:', error)
    throw error
  }
}

module.exports = {
  checkLockout,
  incrementFailedAttempts,
  clearFailedAttempts,
  unlockAccount,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
}
