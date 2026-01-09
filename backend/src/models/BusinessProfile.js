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

    // Step 3: Business Registration Information
    businessRegistration: {
      registeredName: { type: String, default: '' },
      tradeName: { type: String, default: '' },
      businessType: { type: String, enum: ['sole_proprietorship', 'partnership', 'corporation', ''], default: '' },
      registrationAgency: { type: String, enum: ['dti', 'sec', 'cda', ''], default: '' },
      registrationNumber: { type: String, default: '' },
      registrationFileUrl: { type: String, default: '' },
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 4: Business Location & Classification
    location: {
      address: { type: String, default: '' },
      region: { type: String, default: '' },
      province: { type: String, default: '' },
      city: { type: String, default: '' },
      barangay: { type: String, default: '' },
      gps: {
        lat: { type: Number },
        lng: { type: Number }
      },
      natureOfBusiness: { type: String, default: '' }, // Primary + Secondary
      riskCategory: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 5: Tax & Local Compliance Info
    compliance: {
      tin: { type: String, default: '' },
      barangayClearance: { type: String, default: '' }, // Number or "To Be Submitted"
      mayorsPermit: { type: String, default: '' },
      fireSafetyCert: { type: String, default: '' },
      sanitaryPermit: { type: String, default: '' },
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 6: Business Profile Details
    profileDetails: {
      operatingHours: { type: String, default: '' },
      numberOfEmployees: { type: Number, default: 0 },
      floorArea: { type: Number, default: 0 },
      equipment: { type: String, default: '' },
      hasHazards: { type: Boolean, default: false },
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 7: Notifications & Communication Setup
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      isSubmitted: { type: Boolean, default: false }
    },

    // Step 8: Legal Consent & Final Submission
    consent: {
      termsAccepted: { type: Boolean, default: false },
      privacyAccepted: { type: Boolean, default: false },
      digitalInspectionConsent: { type: Boolean, default: false },
      isSubmitted: { type: Boolean, default: false }
    },

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
