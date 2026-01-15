const mongoose = require('mongoose')

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // Step 2: Owner Identity Information
    ownerIdentity: {
      fullName: { type: String, default: '' },
      dateOfBirth: { type: Date },
      idType: { type: String, default: '' },
      idNumber: { type: String, default: '' },
      idFileUrl: { type: String, default: '' }, // URL to uploaded ID
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 4: Legal Consent Checkboxes (Replaces previous Business Registration step in sequence)
    consent: {
      confirmTrueAndAccurate: { type: Boolean, default: false }, // Confirm all information is true & accurate
      acceptLegalDisclaimers: { type: Boolean, default: false }, // Accept legal disclaimers
      acknowledgePrivacyPolicy: { type: Boolean, default: false }, // Acknowledge privacy & data policy
      isSubmitted: { type: Boolean, default: false }
    },

    // Deprecated Steps (Kept for Schema compatibility if needed, but not used in new flow)
    businessRegistration: { type: Object, default: {} },
    location: { type: Object, default: {} },
    compliance: { type: Object, default: {} },
    profileDetails: { type: Object, default: {} },
    notifications: { type: Object, default: {} },

    // Overall Status
    status: { 
      type: String, 
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'needs_revision'], 
      default: 'draft' 
    },
    currentStep: { type: Number, default: 2 } // Track progress (starts at 2 because 1 is account creation)
  },
  { timestamps: true }
)

module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema)
