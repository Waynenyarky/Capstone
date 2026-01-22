const mongoose = require('mongoose')

/**
 * Temporary Credential Model
 * Stores temporary credentials issued by Admin for Staff password recovery
 */
const TemporaryCredentialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    tempPasswordHash: {
      type: String,
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Admin who issued the credentials
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      // Absolute expiration time (e.g., 24 hours from issuance)
    },
    expiresAfterFirstLogin: {
      type: Boolean,
      default: true,
      // If true, credentials expire after first use
    },
    usedAt: {
      type: Date,
      default: null,
      // Timestamp when credentials were first used
    },
    isExpired: {
      type: Boolean,
      default: false,
      index: true,
    },
    recoveryRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecoveryRequest',
      default: null,
      // Link to the recovery request that triggered this
    },
    metadata: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      office: { type: String, default: '' },
      role: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
TemporaryCredentialSchema.index({ userId: 1, isExpired: 1 })
TemporaryCredentialSchema.index({ expiresAt: 1 })
TemporaryCredentialSchema.index({ issuedBy: 1 })

// Method to check if credentials are expired
TemporaryCredentialSchema.methods.isValid = function () {
  if (this.isExpired) return false
  if (Date.now() > this.expiresAt.getTime()) return false
  if (this.expiresAfterFirstLogin && this.usedAt) return false
  return true
}

// Method to mark as used
TemporaryCredentialSchema.methods.markAsUsed = function () {
  this.usedAt = new Date()
  if (this.expiresAfterFirstLogin) {
    this.isExpired = true
  }
  return this.save()
}

module.exports = mongoose.models.TemporaryCredential || mongoose.model('TemporaryCredential', TemporaryCredentialSchema)
