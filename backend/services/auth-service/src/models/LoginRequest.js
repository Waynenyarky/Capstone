const mongoose = require('mongoose')

const LoginRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    loginToken: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
)

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
LoginRequestSchema.plugin(encryptionPlugin, {
  fields: ['code', 'loginToken', 'userId'],
  deterministicFields: ['email'],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
})

LoginRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.models.LoginRequest || mongoose.model('LoginRequest', LoginRequestSchema)
