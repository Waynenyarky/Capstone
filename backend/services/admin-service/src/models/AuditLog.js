const mongoose = require('mongoose')

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
        'password_change',
        'account_deletion',
        'mfa_enabled',
        'mfa_disabled',
        'login',
        'logout',
        'admin_approval',
        'admin_approval_request',
        'admin_approval_approved',
        'admin_approval_rejected',
        'admin_rejection',
        'document_upload',
        'document_delete',
        'role_change',
        'account_lock',
        'account_unlock',
        'email_change',
        'phone_change',
        'permit_review',
        'permit_review_started',
        'security_event',
        'form_definition_published',
        'form_definition_deleted',
        'form_group_retired',
        'form_group_deactivated',
        'form_group_reactivated',
        'maintenance_mode',
        'penalty_config_created',
        'penalty_config_updated',
        'penalty_config_reset',
        'general_permit_config_updated',
        'lgu_created',
        'lgu_updated',
        'lgu_deleted',
        'fee_config_created',
        'fee_config_updated',
        'fee_config_deleted',
        'other',
      ],
      index: true,
    },
    fieldChanged: {
      type: String,
      required: false,
    },
    oldValue: {
      type: String,
      default: '',
    },
    newValue: {
      type: String,
      default: '',
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    txHash: {
      type: String,
      default: '',
      index: true,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    role: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ eventType: 1, createdAt: -1 })
AuditLogSchema.index({ txHash: 1 })

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)
