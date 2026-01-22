const mongoose = require('mongoose')

const AuditViewLogSchema = new mongoose.Schema(
  {
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      // User who viewed the audit log
    },
    viewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      // User whose audit log was viewed
    },
    auditLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditLog',
      default: null,
      index: true,
      // Specific audit log viewed (null if viewing history list)
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Additional context (export format, filters used, etc.)
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
AuditViewLogSchema.index({ viewerId: 1, viewedAt: -1 })
AuditViewLogSchema.index({ viewedUserId: 1, viewedAt: -1 })
AuditViewLogSchema.index({ auditLogId: 1 })
AuditViewLogSchema.index({ viewedAt: -1 })

module.exports = mongoose.models.AuditViewLog || mongoose.model('AuditViewLog', AuditViewLogSchema)