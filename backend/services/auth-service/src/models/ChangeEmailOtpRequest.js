const mongoose = require('mongoose')

/**
 * Stores OTP-based email change requests so they survive server restarts.
 * Used by POST /api/auth/change-email/start and /change-email/verify.
 */
const ChangeEmailOtpRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
ChangeEmailOtpRequestSchema.plugin(encryptionPlugin, {
  fields: ['code'],
  deterministicFields: ['currentEmail', 'newEmail'],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
})

ChangeEmailOtpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL: remove when expired

module.exports = mongoose.models.ChangeEmailOtpRequest || mongoose.model('ChangeEmailOtpRequest', ChangeEmailOtpRequestSchema)
