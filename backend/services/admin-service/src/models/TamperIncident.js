const mongoose = require('mongoose')

const TamperIncidentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved'],
      default: 'new',
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['tamper_detected', 'verification_error', 'not_logged'],
      default: 'tamper_detected',
      index: true,
    },
    message: {
      type: String,
      default: '',
    },
    affectedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    auditLogIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuditLog',
        index: true,
      },
    ],
    containmentActive: {
      type: Boolean,
      default: false,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    verificationPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verificationEvents: {
      type: [
        {
          at: Date,
          payload: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

TamperIncidentSchema.index({ status: 1, severity: 1, createdAt: -1 })
TamperIncidentSchema.index({ detectedAt: -1 })

// Prevent OverwriteModelError by checking if model already exists
module.exports = mongoose.models.TamperIncident || mongoose.model('TamperIncident', TamperIncidentSchema)
