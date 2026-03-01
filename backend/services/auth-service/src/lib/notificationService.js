const User = require('../models/User')
const Role = require('../models/Role')
const mailer = require('./mailer')
const internalNotificationService = require('../services/notificationService')

/**
 * Get active admin user IDs (for in-app notifications)
 * @param {string|ObjectId} [excludeUserId] - Optional user ID to exclude (e.g. requesting admin)
 * @returns {Promise<string[]>} Array of admin user IDs
 */
async function getActiveAdminUserIds(excludeUserId = null) {
  const adminRole = await Role.findOne({ slug: 'admin' })
  if (!adminRole) return []
  const admins = await User.find({ role: adminRole._id, isActive: true }).lean()
  let ids = admins.map((a) => String(a._id))
  if (excludeUserId) {
    const exclude = String(excludeUserId)
    ids = ids.filter((id) => id !== exclude)
  }
  return ids
}

/**
 * Create in-app notifications for all active admins (or all except excludeUserId)
 * Non-blocking; logs errors.
 * @param {string} type - Notification type
 * @param {string} title - Title
 * @param {string} message - Message
 * @param {string} [relatedEntityType] - Related entity type
 * @param {string} [relatedEntityId] - Related entity ID
 * @param {object} [metadata] - Metadata
 * @param {string|ObjectId} [excludeUserId] - Admin user ID to exclude from recipients
 */
async function createInAppNotificationsForAdmins(type, title, message, relatedEntityType = null, relatedEntityId = null, metadata = {}, excludeUserId = null) {
  try {
    const adminIds = await getActiveAdminUserIds(excludeUserId)
    if (adminIds.length === 0) return
    for (const adminId of adminIds) {
      try {
        await internalNotificationService.createNotification(
          adminId,
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId,
          metadata
        )
      } catch (err) {
        console.error(`Failed to create in-app notification for admin ${adminId}:`, err.message)
      }
    }
  } catch (err) {
    console.error('Error creating in-app notifications for admins:', err)
  }
}

/**
 * Notification Service
 * Handles sending email notifications for critical changes and admin alerts
 */

/**
 * Send email change notification to both old and new email
 * @param {string|ObjectId} userId - User ID
 * @param {string} oldEmail - Old email address
 * @param {string} newEmail - New email address
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, sentToOld?: boolean, sentToNew?: boolean, error?: string}>}
 */
async function sendEmailChangeNotification(userId, oldEmail, newEmail, options = {}) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { gracePeriodHours = 24, revertUrl } = options

    // Send to old email
    let sentToOld = false
    try {
      await mailer.sendEmailChangeNotification({
        to: oldEmail,
        oldEmail,
        newEmail,
        gracePeriodHours,
        revertUrl,
        type: 'old_email',
      })
      sentToOld = true
    } catch (error) {
      console.error('Failed to send email change notification to old email:', error)
    }

    // Send to new email
    let sentToNew = false
    try {
      await mailer.sendEmailChangeNotification({
        to: newEmail,
        oldEmail,
        newEmail,
        gracePeriodHours,
        revertUrl,
        type: 'new_email',
      })
      sentToNew = true
    } catch (error) {
      console.error('Failed to send email change notification to new email:', error)
    }

    return {
      success: sentToOld || sentToNew, // Success if at least one email sent
      sentToOld,
      sentToNew,
    }
  } catch (error) {
    console.error('Error sending email change notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send password change notification
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPasswordChangeNotification(userId, options = {}) {
  try {
    const user = await User.findById(userId).populate('role').lean()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    await mailer.sendPasswordChangeNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      timestamp: new Date(),
      ...options,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending password change notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send MFA enabled notification (authenticator or passkey)
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - { method: 'authenticator' | 'passkey' }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendMfaEnabledNotification(userId, options = {}) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) return { success: false, error: 'User not found' }
    await mailer.sendMfaEnabledNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      method: options.method || 'authenticator',
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending MFA enabled notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send MFA disable requested notification (24-hour delay)
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - { scheduledFor: Date }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendMfaDisableRequestedNotification(userId, options = {}) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) return { success: false, error: 'User not found' }
    await mailer.sendMfaDisableRequestedNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      scheduledFor: options.scheduledFor,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending MFA disable requested notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send MFA disabled notification (after disable completed)
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendMfaDisabledNotification(userId) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) return { success: false, error: 'User not found' }
    await mailer.sendMfaDisabledNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending MFA disabled notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send passkey added notification
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPasskeyAddedNotification(userId) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) return { success: false, error: 'User not found' }
    await mailer.sendPasskeyAddedNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending passkey added notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send passkey removed notification
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPasskeyRemovedNotification(userId) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) return { success: false, error: 'User not found' }
    await mailer.sendPasskeyRemovedNotification({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending passkey removed notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

/**
 * Send admin alert for suspicious activity
 * @param {string} type - Alert type (e.g., 'suspicious_login', 'unusual_activity')
 * @param {object} data - Alert data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendAdminAlert(type, data = {}) {
  try {
    // Find all admin users (role is ObjectId ref, so resolve by Role slug first)
    const adminIds = await getActiveAdminUserIds()
    if (adminIds.length === 0) {
      return { success: false, error: 'No admin users found' }
    }
    const adminUsers = await User.find({ _id: { $in: adminIds } }).lean()

    const results = []
    for (const admin of adminUsers) {
      try {
        await mailer.sendAdminAlert({
          to: admin.email,
          type,
          data,
          adminName: (admin.firstName || admin.lastName) ? [admin.firstName, admin.lastName].filter(Boolean).join(' ') : 'Admin',
        })
        results.push({ email: admin.email, success: true })
      } catch (error) {
        console.error(`Failed to send admin alert to ${admin.email}:`, error)
        results.push({ email: admin.email, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    return {
      success: successCount > 0,
      sent: successCount,
      total: results.length,
      results,
    }
  } catch (error) {
    console.error('Error sending admin alert:', error)
    return { success: false, error: error.message || 'Failed to send admin alert' }
  }
}

/**
 * Send approval notification
 * @param {string|ObjectId} userId - User ID
 * @param {string} type - Approval type (e.g., 'email_change', 'profile_update')
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendApprovalNotification(userId, type, options = {}) {
  try {
    const user = await User.findById(userId).lean()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { approved, reason, adminName } = options

    await mailer.sendApprovalNotification({
      to: user.email,
      firstName: user.firstName || 'User',
      type,
      approved,
      reason,
      adminName,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending approval notification:', error)
    return { success: false, error: error.message || 'Failed to send notification' }
  }
}

module.exports = {
  getActiveAdminUserIds,
  createInAppNotificationsForAdmins,
  sendEmailChangeNotification,
  sendPasswordChangeNotification,
  sendMfaEnabledNotification,
  sendMfaDisableRequestedNotification,
  sendMfaDisabledNotification,
  sendPasskeyAddedNotification,
  sendPasskeyRemovedNotification,
  sendAdminAlert,
  sendApprovalNotification,
}
