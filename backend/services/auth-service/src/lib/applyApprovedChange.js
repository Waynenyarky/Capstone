const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const MaintenanceWindow = require('../models/MaintenanceWindow')
const { addToPasswordHistory } = require('./passwordHistory')
const { createAuditLog } = require('./auditLogger')
const logger = require('./logger')

/**
 * Apply approved admin change to user account
 * This function is used by admin-service to apply approved changes
 */
async function applyApprovedChange(approval) {
  try {
    const user = await User.findById(approval.userId).populate('role')
    if (!user) {
      logger.error('User not found for approval:', { approvalId: approval.approvalId })
      return { success: false, error: 'User not found' }
    }

    const roleSlug = (user.role && user.role.slug) ? user.role.slug : 'user'

    switch (approval.requestType) {
      case 'personal_info_change': {
        const { newValues } = approval.requestDetails
        if (newValues.firstName) user.firstName = newValues.firstName
        if (newValues.lastName) user.lastName = newValues.lastName
        if (newValues.phoneNumber !== undefined) user.phoneNumber = newValues.phoneNumber
        await user.save()

        // Create audit log
        const changedFields = Object.keys(newValues)
        // Use first field for fieldChanged (enum constraint), full list in metadata
        const primaryField = changedFields[0] || 'firstName'
        await createAuditLog(
          user._id,
          'admin_approval_approved',
          primaryField,
          JSON.stringify(approval.requestDetails.oldValues),
          JSON.stringify(newValues),
          roleSlug,
          {
            approvalId: approval.approvalId,
            requestType: approval.requestType,
            approvedBy: approval.approvals.map((a) => String(a.adminId)),
            allChangedFields: changedFields,
          }
        )

        return { success: true }
      }

      case 'email_change': {
        const { newEmail } = approval.requestDetails
        const oldEmail = user.email
        user.email = newEmail
        user.isEmailVerified = false
        user.mfaReEnrollmentRequired = true
        user.mfaEnabled = false
        user.mfaSecret = ''
        user.mfaMethod = ''
        await user.save()

        // Create audit log
        await createAuditLog(
          user._id,
          'admin_approval_approved',
          'email',
          oldEmail,
          newEmail,
          roleSlug,
          {
            approvalId: approval.approvalId,
            requestType: approval.requestType,
            approvedBy: approval.approvals.map((a) => String(a.adminId)),
            mfaReEnrollmentRequired: true,
          }
        )

        return { success: true }
      }

      case 'password_change': {
        const { newPasswordHash } = approval.metadata
        if (!newPasswordHash) {
          return { success: false, error: 'Password hash not found in approval metadata' }
        }

        const oldHash = String(user.passwordHash)
        const updatedHistory = addToPasswordHistory(oldHash, user.passwordHistory || [])

        user.passwordHash = newPasswordHash
        user.passwordHistory = updatedHistory
        user.tokenVersion = (user.tokenVersion || 0) + 1 // Invalidate all sessions
        user.mfaReEnrollmentRequired = true
        user.mfaEnabled = false
        user.mfaSecret = ''
        user.fprintEnabled = false
        user.mfaMethod = ''
        user.mfaDisablePending = false
        user.mfaDisableRequestedAt = null
        user.mfaDisableScheduledFor = null
        user.tokenFprint = ''
        await user.save()

        // Clear password hash from approval metadata (security)
        approval.metadata.newPasswordHash = undefined
        await approval.save()

        // Create audit log
        await createAuditLog(
          user._id,
          'admin_approval_approved',
          'password',
          '[REDACTED]',
          '[REDACTED]',
          roleSlug,
          {
            approvalId: approval.approvalId,
            requestType: approval.requestType,
            approvedBy: approval.approvals.map((a) => String(a.adminId)),
            tokenVersion: user.tokenVersion,
            mfaReEnrollmentRequired: true,
          }
        )

        return { success: true }
      }

      case 'maintenance_mode': {
        const { action, message, expectedResumeAt } = approval.requestDetails || {}
        const approvedBy = approval.approvals.map((a) => String(a.adminId))
        const now = new Date()

        if (action === 'enable') {
          await MaintenanceWindow.updateMany({ isActive: true }, { isActive: false, status: 'ended', deactivatedAt: now })
          await MaintenanceWindow.create({
            status: 'active',
            isActive: true,
            message: message || '',
            expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt) : null,
            requestedBy: approval.requestedBy,
            approvedBy,
            activatedAt: now,
            metadata: { approvalId: approval.approvalId },
          })
        } else if (action === 'disable') {
          await MaintenanceWindow.findOneAndUpdate(
            { isActive: true },
            { isActive: false, status: 'ended', deactivatedAt: now },
            { sort: { createdAt: -1 } }
          )
        }

        await createAuditLog(
          approval.requestedBy,
          'maintenance_mode',
          'maintenance',
          '',
          action,
          'admin',
          {
            approvalId: approval.approvalId,
            message: message || '',
            expectedResumeAt: expectedResumeAt || null,
            approvedBy,
          }
        )

        return { success: true }
      }

      default:
        return { success: false, error: 'Unknown request type' }
    }
  } catch (error) {
    logger.error('Error applying approved change:', { error: error.message, approvalId: approval.approvalId })
    return { success: false, error: error.message }
  }
}

module.exports = applyApprovedChange
