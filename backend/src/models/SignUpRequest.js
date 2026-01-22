const mongoose = require('mongoose')

const SignUpRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    payload: { type: Object },
  },
  { timestamps: true }
)

SignUpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.models.SignUpRequest || mongoose.model('SignUpRequest', SignUpRequestSchema)