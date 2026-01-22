const mongoose = require('mongoose')

const ResetRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    resetToken: { type: String },
  },
  { timestamps: true }
)

ResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.models.ResetRequest || mongoose.model('ResetRequest', ResetRequestSchema)