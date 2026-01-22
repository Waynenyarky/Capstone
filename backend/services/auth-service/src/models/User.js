const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, default: '', unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    office: { type: String, default: '' },
    isStaff: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    mustChangeCredentials: { type: Boolean, default: false },
    mustSetupMfa: { type: Boolean, default: false },
    avatarUrl: { type: String, default: '' }, // Legacy: local file URL (for backward compatibility)
    avatarIpfsCid: { type: String, default: '' }, // IPFS CID for avatar image
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
    webauthnCredentials: {
      type: [
        {
          credId: { type: String, required: true },
          publicKey: { type: String, required: true },
          counter: { type: Number, default: 0 },
          transports: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    // Account deletion scheduling (30-day waiting period)
    deletionRequestedAt: { type: Date, default: null },
    deletionScheduledFor: { type: Date, default: null },
    deletionPending: { type: Boolean, default: false },
    // Session invalidation - increment to invalidate all existing tokens
    tokenVersion: { type: Number, default: 0 },
    // Password history - store last 5 password hashes to prevent reuse
    passwordHistory: [{ type: String }],
    // Account lockout - track failed verification attempts
    failedVerificationAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date, default: null },
    lastFailedAttemptAt: { type: Date, default: null },
    // MFA re-enrollment flag
    mfaReEnrollmentRequired: { type: Boolean, default: false },
    // IP tracking for suspicious activity detection
    recentLoginIPs: [
      {
        ip: { type: String, required: true },
        timestamp: { type: Date, required: true },
        location: { type: String, default: '' }, // Optional: geolocation data
      },
    ],
    // Deletion undo token
    deletionUndoToken: { type: String, default: null },
    deletionUndoExpiresAt: { type: Date, default: null },
    // Theme preference (default, dark, document, blossom, sunset, royal)
    theme: { type: String, default: 'default' },
    // Blockchain integration fields (for migration tracking)
    profileHash: { type: String, default: '' }, // SHA256 hash of profile data
    profileIpfsCid: { type: String, default: '' }, // IPFS CID of full profile JSON
    userEthereumAddress: { type: String, default: '' }, // Ethereum address (for blockchain registration)
  },
  { timestamps: true }
)

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    // If role is populated, return the slug as the role string for backward compatibility
    if (ret.role && typeof ret.role === 'object' && ret.role.slug) {
      ret.role = ret.role.slug
    }
    return ret
  },
})

module.exports = mongoose.models.User || mongoose.model('User', UserSchema)
