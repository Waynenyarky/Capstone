const mongoose = require('mongoose')

const LoginRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    loginToken: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
)

LoginRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('LoginRequest', LoginRequestSchema)