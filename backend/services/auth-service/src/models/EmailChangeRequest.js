const mongoose = require('mongoose')

const EmailChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    oldEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // 24 hours from request
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    reverted: {
      type: Boolean,
      default: false,
    },
    revertedAt: {
      type: Date,
      default: null,
    },
    applied: {
      type: Boolean,
      default: false,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
EmailChangeRequestSchema.index({ userId: 1, createdAt: -1 })
EmailChangeRequestSchema.index({ expiresAt: 1 })
EmailChangeRequestSchema.index({ reverted: 1, applied: 1 })

// Method to check if grace period is still active
EmailChangeRequestSchema.methods.isWithinGracePeriod = function () {
  return !this.reverted && !this.applied && new Date() < this.expiresAt
}

// Method to check if expired
EmailChangeRequestSchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt
}

module.exports = mongoose.models.EmailChangeRequest || mongoose.model('EmailChangeRequest', EmailChangeRequestSchema)
