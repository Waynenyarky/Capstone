const mongoose = require('mongoose')

const ProviderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    businessType: { type: String, default: '' },
    yearsInBusiness: { type: Number, default: 0 },
    servicesCategories: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    streetAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    businessPhone: { type: String, default: '' },
    businessEmail: { type: String, default: '' },
    businessDescription: { type: String, default: '' },
    socialLinks: { type: [String], default: [] },
    hasInsurance: { type: Boolean, default: false },
    hasLicenses: { type: Boolean, default: false },
    consentsToBackgroundCheck: { type: Boolean, default: false },
    isSolo: { type: Boolean, default: true },
    teamMembers: [
      new mongoose.Schema(
        {
          firstName: { type: String, default: '' },
          lastName: { type: String, default: '' },
          email: { type: String, default: '' },
          phone: { type: String, default: '' },
        },
        { _id: false }
      ),
    ],
    welcomeAcknowledged: { type: Boolean, default: false },
    // Onboarding flow state for configuring offered services
    onboardingStatus: { type: String, enum: ['not_started', 'in_progress', 'completed', 'skipped'], default: 'not_started' },
    onboardingStartedAt: { type: Date, default: null },
    onboardingCompletedAt: { type: Date, default: null },
    onboardingSkippedAt: { type: Date, default: null },
    // Account/state status for provider after application decision
    status: { type: String, enum: ['pending', 'active', 'rejected', 'deletion_pending', 'deleted', 'inactive'], default: 'pending' },
    // Application review decision (separate from ongoing account status)
    applicationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Optional admin-provided reason when application is rejected
    rejectionReason: { type: String, default: '' },
    // Application lifecycle metadata
    applicationSubmissionCount: { type: Number, default: 0 },
    currentApplicationVersion: { type: Number, default: 0 },
    lastApplicationEditedAt: { type: Date, default: null },
    lastApplicationSubmittedAt: { type: Date, default: null },
    applicationHistory: [
      new mongoose.Schema(
        {
          version: { type: Number, required: true },
          submittedAt: { type: Date, required: true },
          decision: { type: String, enum: ['pending', 'approved', 'rejected', 'withdrawn'], default: 'pending' },
          reviewedAt: { type: Date, default: null },
          reviewedByEmail: { type: String, default: '' },
          reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          rejectionReason: { type: String, default: '' },
          businessSnapshot: {
            businessName: { type: String, default: '' },
            businessType: { type: String, default: '' },
            yearsInBusiness: { type: Number, default: 0 },
            servicesCategories: { type: [String], default: [] },
            serviceAreas: { type: [String], default: [] },
            streetAddress: { type: String, default: '' },
            city: { type: String, default: '' },
            province: { type: String, default: '' },
            zipCode: { type: String, default: '' },
            businessPhone: { type: String, default: '' },
            businessEmail: { type: String, default: '' },
            businessDescription: { type: String, default: '' },
            socialLinks: { type: [String], default: [] },
            hasInsurance: { type: Boolean, default: false },
            hasLicenses: { type: Boolean, default: false },
            consentsToBackgroundCheck: { type: Boolean, default: false },
            isSolo: { type: Boolean, default: true },
            teamMembers: [
              new mongoose.Schema(
                {
                  firstName: { type: String, default: '' },
                  lastName: { type: String, default: '' },
                  email: { type: String, default: '' },
                  phone: { type: String, default: '' },
                },
                { _id: false }
              ),
            ],
          },
        },
        { _id: false }
      ),
    ],
    // Audit trail for provider account status changes (active/inactive/etc.)
    accountStatusHistory: [
      new mongoose.Schema(
        {
          status: { type: String, enum: ['pending', 'active', 'inactive', 'deletion_pending', 'deleted', 'rejected'], default: 'pending' },
          reason: { type: String, default: '' },
          changedAt: { type: Date, default: Date.now },
          changedByEmail: { type: String, default: '' },
          changedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        },
        { _id: false }
      ),
    ],
    // Appeals filed by provider when account is inactive (or other states)
    accountAppeals: [
      new mongoose.Schema(
        {
          status: { type: String, enum: ['pending', 'approved', 'denied', 'withdrawn'], default: 'pending' },
          appealReason: { type: String, default: '' },
          relatedStatus: { type: String, enum: ['inactive', 'rejected', 'pending', 'active', 'deletion_pending', 'deleted'], default: 'inactive' },
          submittedAt: { type: Date, default: Date.now },
          submittedByEmail: { type: String, default: '' },
          submittedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          decisionNotes: { type: String, default: '' },
          decidedAt: { type: Date, default: null },
          decidedByEmail: { type: String, default: '' },
          decidedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        },
        { _id: true }
      ),
    ],
    // Deletion scheduling mirrors User (for provider records)
    deletionRequestedAt: { type: Date, default: null },
    deletionScheduledFor: { type: Date, default: null },
    deletionPending: { type: Boolean, default: false },
    // Audit fields for application review metadata
    reviewedAt: { type: Date, default: null },
    reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedByEmail: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Provider', ProviderSchema)