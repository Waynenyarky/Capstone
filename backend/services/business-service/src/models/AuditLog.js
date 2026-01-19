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
        'admin_rejection',
        'document_upload',
        'document_delete',
        'role_change',
        'account_lock',
        'account_unlock',
        'email_change',
        'phone_change',
        'other',
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

module.exports = mongoose.model('AuditLog', AuditLogSchema)
