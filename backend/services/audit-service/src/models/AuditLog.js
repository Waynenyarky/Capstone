const mongoose = require('mongoose');
const crypto = require('crypto');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'profile_update',
        'email_change',
        'password_change',
        'id_verification',
        'admin_approval',
        'admin_approval_request',
        'admin_approval_approved',
        'admin_approval_rejected',
        'contact_update',
        'name_update',
        'id_update',
        'id_upload',
        'id_upload_reverted',
        'terms_accepted',
        'mfa_enabled',
        'mfa_disabled',
        'session_invalidated',
        'email_change_reverted',
        'restricted_field_attempt',
        'account_lockout',
        'account_unlock',
        'security_event',
        'error_critical',
        'maintenance_mode',
        // Account recovery events
        'account_recovery_initiated',
        'account_recovery_completed',
        'temporary_credentials_issued',
        'temporary_credentials_used',
        'temporary_credentials_expired',
        // Account deletion events
        'account_deletion_requested',
        'account_deletion_approved',
        'account_deletion_denied',
        'account_deletion_scheduled',
        'account_deletion_undone',
        'account_deletion_finalized',
        'admin_deletion_requested',
        'admin_deletion_approved',
        'admin_deletion_denied',
        // Session events
        'session_timeout',
      ],
      index: true,
    },
    fieldChanged: {
      type: String,
      required: false,
      enum: [
        'email',
        'password',
        'firstName',
        'lastName',
        'phoneNumber',
        'id',
        'idType',
        'idNumber',
        'dateOfBirth',
        'avatar',
        'termsAccepted',
        'mfa',
        'role',
        'office',
        'department',
        'security',
        'system',
        'account',
        'session',
        'recovery',
        'maintenance',
      ],
    },
    oldValue: {
      type: String,
      default: '',
      // For sensitive fields like password, store hash instead of plain text
    },
    newValue: {
      type: String,
      default: '',
      // For sensitive fields like password, store hash instead of plain text
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // SHA256 hash of the full audit record (calculated in pre-save hook)
      // Note: Validation is skipped if hash is being set in pre-save hook
    },
    txHash: {
      type: String,
      default: '',
      index: true,
      // Blockchain transaction hash
    },
    blockNumber: {
      type: Number,
      default: null,
      // Block number where transaction was mined
    },
    role: {
      type: String,
      required: true,
      // Role of the user who made the change
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Additional context: IP address, user agent, approval IDs, etc.
    },
    verified: {
      type: Boolean,
      default: false,
      // Whether this log has been verified against blockchain
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient querying (txHash already has index: true on the field)
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ eventType: 1, createdAt: -1 });
AuditLogSchema.index({ verified: 1 });

// Note: Hash is now calculated manually before creating the document
// This avoids validation issues and ensures the hash is always set correctly
// The pre-save hook was removed since we calculate the hash in the route handler

// Method to verify the hash matches the current data
AuditLogSchema.methods.verifyHash = function () {
  const hashableData = {
    userId: String(this.userId),
    eventType: this.eventType,
    fieldChanged: this.fieldChanged || '',
    oldValue: this.oldValue || '',
    newValue: this.newValue || '',
    role: this.role,
    metadata: JSON.stringify(this.metadata || {}),
    timestamp: this.createdAt.toISOString(),
  };

  const dataString = JSON.stringify(hashableData);
  const calculatedHash = crypto.createHash('sha256').update(dataString).digest('hex');
  return calculatedHash === this.hash;
};

// Static method to create audit log with automatic hash calculation
AuditLogSchema.statics.createAuditLog = async function (data) {
  const auditLog = new this(data);
  await auditLog.save();
  return auditLog;
};

// Static method to get audit history for a user
AuditLogSchema.statics.getUserAuditHistory = async function (userId, options = {}) {
  const { limit = 50, skip = 0, eventType } = options;
  const query = { userId };
  if (eventType) {
    query.eventType = eventType;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
