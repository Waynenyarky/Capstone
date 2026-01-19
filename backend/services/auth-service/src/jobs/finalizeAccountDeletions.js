/**
 * Finalize Account Deletions Job
 * Permanently deletes accounts that have passed their grace period
 */

const User = require('../models/User')
const { createAuditLog } = require('../lib/auditLogger')
const logger = require('../lib/logger')

async function finalizeAccountDeletions() {
  try {
    const now = new Date()
    
    // Find users whose deletion grace period has passed
    const usersToDelete = await User.find({
      deletionPending: true,
      deletionScheduledFor: { $lte: now },
    })
      .populate('role')
      .lean()

    if (usersToDelete.length === 0) {
      logger.info('No accounts to finalize deletion')
      return { deleted: 0 }
    }

    let deletedCount = 0
    const errors = []

    for (const user of usersToDelete) {
      try {
        // Log deletion finalization
        const roleSlug = user.role?.slug || 'user'
        await createAuditLog(
          user._id,
          'account_deletion_finalized',
          'account',
          'deletion_pending',
          'account_permanently_deleted',
          roleSlug,
          {
            scheduledFor: user.deletionScheduledFor?.toISOString(),
            finalizedAt: now.toISOString(),
          }
        )

        // Permanently delete user
        await User.deleteOne({ _id: user._id })
        deletedCount++

        logger.info(`Finalized deletion for user: ${user.email}`, { userId: String(user._id) })
      } catch (error) {
        logger.error(`Error finalizing deletion for user ${user.email}`, { error, userId: String(user._id) })
        errors.push({ userId: String(user._id), error: error.message })
      }
    }

    logger.info(`Finalized ${deletedCount} account deletion(s)`, { deletedCount, errors: errors.length })

    return { deleted: deletedCount, errors }
  } catch (error) {
    logger.error('Error in finalizeAccountDeletions job', { error })
    throw error
  }
}

module.exports = finalizeAccountDeletions
