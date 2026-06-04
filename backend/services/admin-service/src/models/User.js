const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: { type: String, default: "", unique: true, sparse: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    office: { type: String, default: "" },
    isStaff: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    mustChangeCredentials: { type: Boolean, default: false },
    mustSetupMfa: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date, default: null },
    termsAccepted: { type: Boolean, default: false },
    // MFA (Time-based One-Time Password)
    mfaEnabled: { type: Boolean, default: false },
    mfaMethod: { type: String, default: "" },
    mfaSecret: { type: String, default: "" },
    mfaDisableRequestedAt: { type: Date, default: null },
    mfaDisableScheduledFor: { type: Date, default: null },
    mfaDisablePending: { type: Boolean, default: false },
    mfaLastUsedTotpCounter: { type: Number, default: -1 },
    mfaLastUsedTotpAt: { type: Date, default: null },
    fprintEnabled: { type: Boolean, default: false },
    tokenFprint: { type: String, default: "" },
    // OAuth provider metadata
    authProvider: { type: String, default: "" },
    providerId: { type: String, default: "" },
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
        location: { type: String, default: "" }, // Optional: geolocation data
      },
    ],
    // Deletion undo token
    deletionUndoToken: { type: String, default: null },
    deletionUndoExpiresAt: { type: Date, default: null },
    // Theme preference (default, dark, document, blossom, sunset, royal)
    theme: { type: String, default: "default" },
    // ── PIS (Personal Information Sheet) fields — for LGU officer review (mirrors auth-service User) ──
    middleName: { type: String, default: "" },
    suffix: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      barangay: { type: String, default: "" },
      city: { type: String, default: "" },
      province: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },
    sex: { type: String, enum: ["", "male", "female"], default: "" },
    maritalStatus: {
      type: String,
      enum: ["", "single", "married", "widowed", "divorced", "separated"],
      default: "",
    },
    dateOfBirth: { type: Date, default: null },
    placeOfBirth: { type: String, default: "" },
    nationality: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    motherName: { type: String, default: "" },
    distinctiveMark: { type: String, default: "" },
    highestEducationalAttainment: {
      type: String,
      enum: [
        "",
        "elementary",
        "high_school",
        "vocational",
        "college",
        "postgraduate",
      ],
      default: "",
    },
  },
  { timestamps: true },
);

UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    // If role is populated, return the slug as the role string for backward compatibility
    if (ret.role && typeof ret.role === "object" && ret.role.slug) {
      ret.role = ret.role.slug;
    }
    return ret;
  },
});

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
UserSchema.plugin(encryptionPlugin, {
  fields: [
    "firstName",
    "lastName",
    "middleName",
    "suffix",
    "phoneNumber",
    "office",
    "mfaSecret",
    "authProvider",
    "providerId",
    "tokenFprint",
    "placeOfBirth",
    "nationality",
    "fatherName",
    "motherName",
    "distinctiveMark",
    "avatarUrl",
    "deletionUndoToken",
  ],
  deterministicFields: ["email", "username"],
  nestedPaths: ["address"],
  arrayPaths: ["recentLoginIPs", "webauthnCredentials"],
  mixedPaths: [],
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
