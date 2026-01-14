const mongoose = require('mongoose')

/**
 * Recovery Request Model
 * Tracks staff password recovery requests from Admin
 */
const RecoveryRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Staff user who requested recovery (if self-requested)
      // null if Admin initiated recovery
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },
    office: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Admin who reviewed the request
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    denialReason: {
      type: String,
      default: '',
    },
    temporaryCredentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemporaryCredential',
      default: null,
      // Link to temporary credentials if issued
    },
    metadata: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      requestedOutsideOfficeHours: { type: Boolean, default: false },
      suspiciousActivityDetected: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
RecoveryRequestSchema.index({ userId: 1, status: 1 })
RecoveryRequestSchema.index({ status: 1, createdAt: -1 })
RecoveryRequestSchema.index({ reviewedBy: 1 })
RecoveryRequestSchema.index({ office: 1, status: 1 })

module.exports = mongoose.model('RecoveryRequest', RecoveryRequestSchema)
