const mongoose = require('mongoose')

const IdVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    idType: { type: String, default: '' }, // e.g., 'passport', 'driver_license', 'national_id'
    idNumber: { type: String, default: '' },
    frontImageUrl: { type: String, default: '' }, // URL to front of ID
    backImageUrl: { type: String, default: '' }, // URL to back of ID
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Admin who verified
    verifiedAt: { type: Date, default: null },
    uploadedAt: { type: Date, default: Date.now },
    rejectionReason: { type: String, default: '' },
    // Allow reverting within 24 hours
    canRevertUntil: { type: Date, default: null }, // Set to 24 hours after upload
    reverted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Index for efficient querying
IdVerificationSchema.index({ userId: 1 })
IdVerificationSchema.index({ status: 1 })
IdVerificationSchema.index({ uploadedAt: -1 })

module.exports = mongoose.model('IdVerification', IdVerificationSchema)
