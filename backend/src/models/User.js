const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    termsAccepted: { type: Boolean, default: false },
    // Account deletion scheduling (30-day waiting period)
    deletionRequestedAt: { type: Date, default: null },
    deletionScheduledFor: { type: Date, default: null },
    deletionPending: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
