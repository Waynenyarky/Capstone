/**
 * Unlock Accounts Job
 * Automatically unlocks accounts whose lockout period has expired
 */

const User = require('../models/User')
const logger = require('../lib/logger')

async function unlockAccounts() {
  try {
    const now = new Date()
    
    // Find users whose lockout period has expired
    const lockedUsers = await User.find({
      accountLockedUntil: { $exists: true, $ne: null, $lte: now },
    }).lean()

    if (lockedUsers.length === 0) {
      return { unlocked: 0 }
    }

    // Unlock accounts
    const result = await User.updateMany(
      {
        accountLockedUntil: { $exists: true, $ne: null, $lte: now },
      },
      {
        $set: {
          accountLockedUntil: null,
          failedVerificationAttempts: 0,
          lastFailedAttemptAt: null,
        },
      }
    )

    if (result.modifiedCount > 0) {
      logger.info(`Unlocked ${result.modifiedCount} account(s)`, { unlockedCount: result.modifiedCount })
    }

    return { unlocked: result.modifiedCount }
  } catch (error) {
    logger.error('Error in unlockAccounts job', { error })
    throw error
  }
}

module.exports = unlockAccounts
