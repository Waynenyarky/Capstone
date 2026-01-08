const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['business_owner', 'admin', 'lgu_officer', 'lgu_manager', 'inspector', 'cso'], default: 'business_owner' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    termsAccepted: { type: Boolean, default: false },
    // MFA (Time-based One-Time Password)
    mfaEnabled: { type: Boolean, default: false },
    mfaMethod: { type: String, default: '' },
    mfaSecret: { type: String, default: '' },
    mfaDisableRequestedAt: { type: Date, default: null },
    mfaDisableScheduledFor: { type: Date, default: null },
    mfaDisablePending: { type: Boolean, default: false },
    mfaLastUsedTotpCounter: { type: Number, default: -1 },
    mfaLastUsedTotpAt: { type: Date, default: null },
    fprintEnabled: { type: Boolean, default: false },
    tokenFprint: { type: String, default: '' },
    // OAuth provider metadata
    authProvider: { type: String, default: '' },
    providerId: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    // Account deletion scheduling (30-day waiting period)
    deletionRequestedAt: { type: Date, default: null },
    deletionScheduledFor: { type: Date, default: null },
    deletionPending: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// UserSchema.pre('validate', function() {
//   const v = String(this.role || '').toLowerCase()
//   if (v && v !== 'user' && v !== 'admin') {
//     this.role = 'user'
//   }
// })

module.exports = mongoose.model('User', UserSchema)
