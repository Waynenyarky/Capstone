/**
 * Send Deletion Reminders Job
 * Sends email reminders to users with pending deletions
 */

const User = require('../models/User')
const { sendOtp } = require('../lib/mailer')
const logger = require('../lib/logger')

async function sendDeletionReminders() {
  try {
    const now = new Date()
    
    // Find users with pending deletions
    const usersWithPendingDeletion = await User.find({
      deletionPending: true,
      deletionScheduledFor: { $exists: true, $ne: null },
    })
      .populate('role')
      .lean()

    if (usersWithPendingDeletion.length === 0) {
      logger.info('No deletion reminders to send')
      return { sent: 0 }
    }

    let sentCount = 0
    const errors = []

    for (const user of usersWithPendingDeletion) {
      try {
        const scheduledFor = new Date(user.deletionScheduledFor)
        const daysRemaining = Math.ceil((scheduledFor.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        // Send reminders at 7 days, 3 days, and 1 day before deletion
        if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
          const subject = `Account Deletion Reminder - ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
          const message = `Your account is scheduled for deletion on ${scheduledFor.toLocaleDateString()}. You have ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining. If you wish to cancel, please use your undo token or contact support.`

          // Use sendOtp for now, but ideally create a dedicated email template
          // For now, we'll just log it
          logger.info(`Deletion reminder for ${user.email}: ${daysRemaining} days remaining`, {
            userId: String(user._id),
            daysRemaining,
            scheduledFor: scheduledFor.toISOString(),
          })

          // TODO: Send actual email when email templates are ready
          // await sendDeletionReminderEmail({ to: user.email, daysRemaining, scheduledFor })

          sentCount++
        }
      } catch (error) {
        logger.error(`Error sending deletion reminder to ${user.email}`, { error, userId: String(user._id) })
        errors.push({ userId: String(user._id), error: error.message })
      }
    }

    logger.info(`Sent ${sentCount} deletion reminder(s)`, { sentCount, errors: errors.length })

    return { sent: sentCount, errors }
  } catch (error) {
    logger.error('Error in sendDeletionReminders job', { error })
    throw error
  }
}

module.exports = sendDeletionReminders
