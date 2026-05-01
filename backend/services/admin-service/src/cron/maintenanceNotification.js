/**
 * Cron job to send in-app notifications 1 day before approved maintenance starts
 */

const AdminApproval = require('../models/AdminApproval')
const { createInAppNotification } = require('../lib/notificationService')
const User = require('../models/User')
const logger = require('../lib/logger')

async function checkAndSendMaintenanceNotifications() {
  try {
    logger.info('Checking for upcoming maintenance to send notifications')

    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find approved maintenance with scheduled start time within the next 24 hours
    const upcomingMaintenance = await AdminApproval.find({
      requestType: 'maintenance_mode',
      status: 'approved',
      'requestDetails.action': 'enable',
      'requestDetails.scheduledStartAt': {
        $gte: oneDayAgo,
        $lte: oneDayFromNow,
      },
    }).lean()

    logger.info(`Found ${upcomingMaintenance.length} upcoming maintenance windows`)

    for (const maintenance of upcomingMaintenance) {
      const scheduledStartAt = new Date(maintenance.requestDetails.scheduledStartAt)
      const expectedResumeAt = maintenance.requestDetails.expectedResumeAt
        ? new Date(maintenance.requestDetails.expectedResumeAt)
        : null
      const reason = maintenance.requestDetails.reason || 'System maintenance'

      // Check if we've already sent a notification for this maintenance
      const notificationSent = maintenance.metadata?.notificationSent
      if (notificationSent) {
        logger.info(`Notification already sent for maintenance ${maintenance.approvalId}`)
        continue
      }

      // Format dates for notification
      const startDate = scheduledStartAt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      const startTime = scheduledStartAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const endTime = expectedResumeAt
        ? expectedResumeAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'not specified'

      // Get all users to send notification
      const users = await User.find({ isActive: true }).lean()
      logger.info(`Sending maintenance notification to ${users.length} users`)

      for (const user of users) {
        await createInAppNotification(
          user._id,
          'maintenance_scheduled',
          'Upcoming Maintenance',
          `Scheduled maintenance on ${startDate} from ${startTime} to ${endTime}. Reason: ${reason}`,
          'maintenance',
          maintenance.approvalId,
          {
            scheduledStartAt: scheduledStartAt,
            expectedResumeAt: expectedResumeAt,
            reason,
          }
        ).catch((err) => logger.warn(`Failed to send notification to user ${user._id}`, { err }))
      }

      // Mark notification as sent
      await AdminApproval.updateOne(
        { approvalId: maintenance.approvalId },
        { 'metadata.notificationSent': true, 'metadata.notificationSentAt': new Date() }
      ).catch((err) => logger.warn('Failed to mark notification as sent', { err }))

      logger.info(`Successfully sent notifications for maintenance ${maintenance.approvalId}`)
    }

    logger.info('Maintenance notification check completed')
  } catch (error) {
    logger.error('Error in maintenance notification cron job', { error })
  }
}

module.exports = { checkAndSendMaintenanceNotifications }
