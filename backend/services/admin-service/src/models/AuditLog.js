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
        'application_claimed',
        'application_released',
        'application_transferred',
        'decision_revoked',
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
        'regulatory_fee_config_updated',
        'other',
        'form_definition_created',
        'form_definition_updated',
        'form_definition_published',
        'form_definition_archived',
        'form_definition_duplicated',
        'announcement_created',
        'announcement_updated',
        'announcement_deleted',
        'staff_created',
        'containment_activated',
        'containment_deactivated',
        'contact_update',
        'name_update',
        'error_critical',
        'restricted_field_attempt',
        'permit_forms_published',
        'permit_forms_reverted',
        'permit_forms_toggled',
        'faq_updated',
        'instruction_updated',
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
    slotId: {
      type: String,
      required: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    blockchainStatus: {
      type: String,
      enum: ['pending', 'anchored', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    blockchainError: { type: String, default: '' },
    blockchainRetries: { type: Number, default: 0 },
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

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
AuditLogSchema.plugin(encryptionPlugin, {
  fields: ['oldValue', 'newValue', 'role', 'blockchainError'],
  deterministicFields: ['hash', 'slotId'],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: ['metadata'],
})

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)
