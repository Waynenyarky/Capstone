const mongoose = require('mongoose')

const MfaBootstrapTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdVia: {
      type: String,
      enum: ['bootstrap_key', 'admin_jwt'],
      default: 'bootstrap_key',
    },
    reason: {
      type: String,
      default: '',
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

MfaBootstrapTokenSchema.methods.isUsable = function () {
  if (this.usedAt) return false
  if (!this.expiresAt) return false
  return Date.now() < this.expiresAt.getTime()
}

module.exports = mongoose.model('MfaBootstrapToken', MfaBootstrapTokenSchema)
