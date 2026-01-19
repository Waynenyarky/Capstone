const User = require('../models/User')
const mailer = require('./mailer')

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
 * Send admin alert for suspicious activity
 * @param {string} type - Alert type (e.g., 'suspicious_login', 'unusual_activity')
 * @param {object} data - Alert data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendAdminAlert(type, data = {}) {
  try {
    // Find all admin users
    const adminUsers = await User.find({ 'role.slug': 'admin' }).lean()
    if (!adminUsers || adminUsers.length === 0) {
      return { success: false, error: 'No admin users found' }
    }

    const results = []
    for (const admin of adminUsers) {
      try {
        await mailer.sendAdminAlert({
          to: admin.email,
          type,
          data,
          adminName: admin.firstName || 'Admin',
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
  sendEmailChangeNotification,
  sendPasswordChangeNotification,
  sendAdminAlert,
  sendApprovalNotification,
}
