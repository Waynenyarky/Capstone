/**
 * Apply Approved Change
 * Handles applying approved admin changes to user accounts
 * This function is used by Admin Service when approvals are completed
 */

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const MaintenanceWindow = require('../models/MaintenanceWindow');
const bcrypt = require('bcryptjs');
const { addToPasswordHistory } = require('./passwordHistory');
const { logToBlockchain } = require('./interServiceClient');
const logger = require('./logger');

/**
 * Calculate hash for audit log (same as in auth service)
 */
function calculateAuditHash(userId, eventType, fieldChanged, oldValue, newValue, role, metadata, timestamp) {
  const crypto = require('crypto');
  const hashableData = {
    userId: String(userId),
    eventType,
    fieldChanged: fieldChanged || '',
    oldValue: oldValue || '',
    newValue: newValue || '',
    role,
    metadata: JSON.stringify(metadata || {}),
    timestamp: timestamp || new Date().toISOString(),
  };
  const dataString = JSON.stringify(hashableData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Create audit log (calls Audit Service via inter-service communication)
 */
async function createAuditLog(userId, eventType, fieldChanged, oldValue, newValue, role, metadata = {}) {
  try {
    // For now, create audit log directly (shared DB)
    // TODO: Call Audit Service via HTTP when fully implemented
    const timestamp = new Date().toISOString();
    const hash = calculateAuditHash(
      userId,
      eventType,
      fieldChanged,
      oldValue || '',
      newValue || '',
      role,
      metadata,
      timestamp
    );
    
    const auditLog = await AuditLog.create({
      userId,
      eventType,
      fieldChanged,
      oldValue: oldValue || '',
      newValue: newValue || '',
      role,
      metadata: {
        ...metadata,
        ip: metadata.ip || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
      },
      hash,
    });

    // Log to blockchain via Audit Service (non-blocking)
    logToBlockchain('logAuditHash', {
      hash: auditLog.hash,
      eventType,
      auditLogId: String(auditLog._id),
    }).catch((err) => {
      logger.warn('Failed to log to blockchain via Audit Service', { error: err });
    });

    return auditLog;
  } catch (error) {
    logger.error('Error creating audit log', { error });
    return null;
  }
}

/**
 * Apply approved change to user account
 */
async function applyApprovedChange(approval) {
  try {
    const user = await User.findById(approval.userId).populate('role');
    if (!user) {
      logger.error('User not found for approval', { approvalId: approval.approvalId });
      return { success: false, error: 'User not found' };
    }

    const roleSlug = (user.role && user.role.slug) ? user.role.slug : 'user';

    switch (approval.requestType) {
      case 'personal_info_change': {
        const { newValues } = approval.requestDetails;
        if (newValues.firstName) user.firstName = newValues.firstName;
        if (newValues.lastName) user.lastName = newValues.lastName;
        if (newValues.phoneNumber !== undefined) user.phoneNumber = newValues.phoneNumber;
        await user.save();

        // Create audit log
        const changedFields = Object.keys(newValues);
        const primaryField = changedFields[0] || 'firstName';
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
        );

        return { success: true };
      }

      case 'email_change': {
        const { newEmail } = approval.requestDetails;
        const oldEmail = user.email;
        user.email = newEmail;
        user.isEmailVerified = false;
        user.mfaReEnrollmentRequired = true;
        user.mfaEnabled = false;
        user.mfaSecret = '';
        user.mfaMethod = '';
        await user.save();

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
        );

        return { success: true };
      }

      case 'password_change': {
        const { newPasswordHash } = approval.metadata;
        if (!newPasswordHash) {
          return { success: false, error: 'Password hash not found in approval metadata' };
        }

        const oldHash = String(user.passwordHash);
        const updatedHistory = addToPasswordHistory(oldHash, user.passwordHistory || []);

        user.passwordHash = newPasswordHash;
        user.passwordHistory = updatedHistory;
        user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all sessions
        user.mfaReEnrollmentRequired = true;
        user.mfaEnabled = false;
        user.mfaSecret = '';
        user.fprintEnabled = false;
        user.mfaMethod = '';
        user.mfaDisablePending = false;
        user.mfaDisableRequestedAt = null;
        user.mfaDisableScheduledFor = null;
        user.tokenFprint = '';
        await user.save();

        // Clear password hash from approval metadata (security)
        approval.metadata.newPasswordHash = undefined;
        await approval.save();

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
        );

        return { success: true };
      }

      case 'maintenance_mode': {
        const { action, message, expectedResumeAt } = approval.requestDetails || {};
        const approvedBy = approval.approvals.map((a) => String(a.adminId));
        const now = new Date();

        if (action === 'enable') {
          await MaintenanceWindow.updateMany(
            { isActive: true },
            { isActive: false, status: 'ended', deactivatedAt: now }
          );
          await MaintenanceWindow.create({
            status: 'active',
            isActive: true,
            message: message || '',
            expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt) : null,
            requestedBy: approval.requestedBy,
            approvedBy,
            activatedAt: now,
            metadata: { approvalId: approval.approvalId },
          });
        } else if (action === 'disable') {
          await MaintenanceWindow.findOneAndUpdate(
            { isActive: true },
            { isActive: false, status: 'ended', deactivatedAt: now },
            { sort: { createdAt: -1 } }
          );
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
        );

        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown request type' };
    }
  } catch (error) {
    logger.error('Error applying approved change', { error, approvalId: approval.approvalId });
    return { success: false, error: error.message };
  }
}

module.exports = applyApprovedChange;
