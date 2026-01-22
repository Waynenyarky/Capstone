const mongoose = require('mongoose')

const DeleteRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    deleteToken: { type: String },
  },
  { timestamps: true }
)

DeleteRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.models.DeleteRequest || mongoose.model('DeleteRequest', DeleteRequestSchema)