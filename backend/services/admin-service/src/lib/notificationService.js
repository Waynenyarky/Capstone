// Import models dynamically to avoid conflicts
let User
let Role
function getUserModel() {
  if (!User) {
    try {
      // Try main backend first (for testing)
      User = require('../../../src/models/User')
    } catch (e) {
      // Fallback to service model
      User = require('../models/User')
    }
  }
  return User
}

function getRoleModel() {
  if (!Role) {
    try {
      // Try main backend first (for testing)
      Role = require('../../../src/models/Role')
    } catch (e) {
      // Fallback to service model
      Role = require('../models/Role')
    }
  }
  return Role
}

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
    const UserModel = getUserModel()
    const user = await UserModel.findById(userId).lean()
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
    const UserModel = getUserModel()
    const user = await UserModel.findById(userId).populate('role').lean()
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
 * Send admin alert email when staff attempts restricted field
 * @param {string|ObjectId} userId - User ID who attempted the change
 * @param {string} field - Field that was attempted
 * @param {any} attemptedValue - Value that was attempted
 * @param {string} roleSlug - Role of the user
 * @param {object} metadata - Additional metadata
 * @returns {Promise<{success: boolean, sentTo?: number, error?: string}>}
 */
async function sendAdminAlert(userId, field, attemptedValue, roleSlug, metadata = {}) {
  try {
    const UserModel = getUserModel()
    const user = await UserModel.findById(userId).lean()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get all admin users
    const RoleModel = getRoleModel()
    const adminRole = await RoleModel.findOne({ slug: 'admin' })
    if (!adminRole) {
      return { success: false, error: 'Admin role not found' }
    }

    const admins = await UserModel.find({ role: adminRole._id, isActive: true }).lean()
    if (admins.length === 0) {
      return { success: false, error: 'No active admins found' }
    }

    // Send alert to all admins
    let sentCount = 0
    const errors = []

    for (const admin of admins) {
      try {
        await mailer.sendAdminAlertEmail({
          to: admin.email,
          adminName: `${admin.firstName} ${admin.lastName}`,
          userId: String(user._id),
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          field,
          attemptedValue: typeof attemptedValue === 'string' ? attemptedValue : JSON.stringify(attemptedValue),
          roleSlug,
          timestamp: new Date(),
          ...metadata,
        })
        sentCount++
      } catch (error) {
        console.error(`Failed to send admin alert to ${admin.email}:`, error)
        errors.push(error.message)
      }
    }

    return {
      success: sentCount > 0,
      sentTo: sentCount,
      totalAdmins: admins.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error('Error sending admin alert:', error)
    return { success: false, error: error.message || 'Failed to send admin alert' }
  }
}

/**
 * Send approval notification to requesting admin
 * @param {string|ObjectId} adminId - Admin ID who requested the approval
 * @param {string} approvalId - Approval request ID
 * @param {string} status - Approval status ('approved' or 'rejected')
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendApprovalNotification(adminId, approvalId, status, options = {}) {
  try {
    const UserModel = getUserModel()
    const admin = await UserModel.findById(adminId).lean()
    if (!admin) {
      return { success: false, error: 'Admin not found' }
    }

    const { requestType, comment, approverName } = options

    await mailer.sendApprovalNotification({
      to: admin.email,
      adminName: `${admin.firstName} ${admin.lastName}`,
      approvalId,
      status,
      requestType,
      comment,
      approverName,
      timestamp: new Date(),
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
