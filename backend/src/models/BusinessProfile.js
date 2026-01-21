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

    // Multiple Businesses Array (Step 3 & 4)
    businesses: [{
      businessId: { type: String, required: true },
      isPrimary: { type: Boolean, default: false },
      businessName: { type: String, required: true },
      registrationStatus: { 
        type: String, 
        enum: ['not_yet_registered', 'proposed'], 
        default: 'not_yet_registered' 
      },
      location: {
        street: { type: String, default: '' },
        barangay: { type: String, default: '' },
        city: { type: String, default: '' },
        municipality: { type: String, default: '' },
        province: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        geolocation: {
          lat: { type: Number },
          lng: { type: Number }
        },
        mailingAddress: { type: String, default: '' }
      },
      businessType: {
        type: String,
        enum: ['retail_trade', 'food_beverages', 'services', 'manufacturing_industrial', 'agriculture_fishery_forestry', 'construction_real_estate_housing', 'transportation_automotive_logistics', 'financial_insurance_banking']
      },
      registrationAgency: {
        type: String,
        enum: ['DTI', 'SEC', 'LGU', 'CDA', 'BIR', 'Barangay_Office', 'FDA', 'BFAD', 'DA', 'DENR', 'PRC', 'MARITIME_INDUSTRY_AUTHORITY']
      },
      businessRegistrationNumber: { type: String, required: true },
      businessStartDate: { type: Date },
      numberOfBranches: { type: Number, default: 0 },
      industryClassification: { type: String, default: '' },
      taxIdentificationNumber: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      riskProfile: {
        businessSize: { type: Number, default: null },
        annualRevenue: { type: Number, default: null },
        businessActivitiesDescription: { type: String, default: '' },
        riskLevel: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'low'
        }
      },
      // New Business Registration Application Fields
      applicationStatus: {
        type: String,
        enum: ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered', 'submitted', 'resubmit', 'under_review', 'approved', 'rejected', 'needs_revision'],
        default: 'draft'
      },
      applicationReferenceNumber: { type: String, default: '' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      reviewComments: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
      // Step 2: Online Application Form (new spec)
      registeredBusinessName: { type: String, default: '' },
      businessTradeName: { type: String, default: '' },
      businessRegistrationType: { type: String, default: '' }, // sole_proprietorship, partnership, corporation, cooperative
      businessRegistrationDate: { type: Date },
      businessAddress: { type: String, default: '' },
      unitBuildingName: { type: String, default: '' },
      street: { type: String, default: '' },
      barangay: { type: String, default: '' },
      cityMunicipality: { type: String, default: '' },
      businessLocationType: { type: String, default: '' }, // owned, leased
      primaryLineOfBusiness: { type: String, default: '' },
      businessClassification: { type: String, default: '' }, // manufacturing, trading_wholesale, retail, service
      industryCategory: { type: String, default: '' },
      declaredCapitalInvestment: { type: Number, default: 0 },
      numberOfBusinessUnits: { type: Number, default: 0 },
      ownerFullName: { type: String, default: '' },
      ownerPosition: { type: String, default: '' },
      ownerNationality: { type: String, default: '' },
      ownerResidentialAddress: { type: String, default: '' },
      ownerTin: { type: String, default: '' },
      governmentIdType: { type: String, default: '' },
      governmentIdNumber: { type: String, default: '' },
      emailAddress: { type: String, default: '' },
      mobileNumber: { type: String, default: '' },
      numberOfEmployees: { type: Number, default: 0 },
      withFoodHandlers: { type: String, default: '' }, // yes, no
      certificationAccepted: { type: Boolean, default: false },
      declarantName: { type: String, default: '' },
      declarationDate: { type: Date },
      requirementsChecklist: {
        confirmed: { type: Boolean, default: false },
        confirmedAt: { type: Date },
        pdfDownloaded: { type: Boolean, default: false },
        pdfDownloadedAt: { type: Date }
      },
      lguDocuments: {
        idPicture: { type: String, default: '' }, // 2x2 ID Picture
        ctc: { type: String, default: '' }, // Community Tax Certificate
        barangayClearance: { type: String, default: '' }, // Barangay Business Clearance
        dtiSecCda: { type: String, default: '' }, // DTI/SEC/CDA Registration
        leaseOrLandTitle: { type: String, default: '' }, // Lease Contract or Land Title (if applicable)
        occupancyPermit: { type: String, default: '' }, // Certificate of Occupancy
        healthCertificate: { type: String, default: '' } // Health Certificate (for food-related businesses)
      },
      aiValidation: {
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        results: {
          documentCompleteness: {
            score: { type: Number, default: 0 },
            issues: { type: Array, default: [] }
          },
          consistency: {
            score: { type: Number, default: 0 },
            issues: { type: Array, default: [] }
          },
          anomalies: { type: Array, default: [] },
          riskFlags: { type: Array, default: [] },
          overallStatus: {
            type: String,
            enum: ['pass', 'warning', 'fail'],
            default: 'pass'
          }
        }
      },
      birRegistration: {
        registrationNumber: { type: String, default: '' }, // Deprecated
        certificateUrl: { type: String, default: '' }, // Deprecated
        registrationFee: { type: Number, default: 500 }, // Deprecated
        documentaryStampTax: { type: Number, default: 0 }, // Deprecated
        businessCapital: { type: Number, default: 0 }, // Deprecated
        booksOfAccountsUrl: { type: String, default: '' }, // Deprecated
        authorityToPrintUrl: { type: String, default: '' }, // Deprecated
        paymentReceiptUrl: { type: String, default: '' } // Payment form/receipt upload
      },
      otherAgencyRegistrations: {
        hasEmployees: { type: Boolean, default: false },
        sss: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }
        },
        philhealth: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }
        },
        pagibig: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }
        }
      },
      submittedAt: { type: Date },
      submittedToLguOfficer: { type: Boolean, default: false },
      isSubmitted: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }],

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
