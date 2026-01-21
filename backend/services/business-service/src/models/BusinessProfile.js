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
      idFileUrl: { type: String, default: '' }, // Legacy: local file URL (for backward compatibility)
      idFileIpfsCid: { type: String, default: '' }, // IPFS CID for uploaded ID
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
        idPicture: { type: String, default: '' }, // Legacy: local file URL (for backward compatibility)
        ctc: { type: String, default: '' }, // Legacy: local file URL
        barangayClearance: { type: String, default: '' }, // Legacy: local file URL
        dtiSecCda: { type: String, default: '' }, // Legacy: local file URL
        leaseOrLandTitle: { type: String, default: '' }, // Legacy: local file URL
        occupancyPermit: { type: String, default: '' }, // Legacy: local file URL
        healthCertificate: { type: String, default: '' }, // Legacy: local file URL
        // IPFS CIDs for LGU documents
        idPictureIpfsCid: { type: String, default: '' },
        ctcIpfsCid: { type: String, default: '' },
        barangayClearanceIpfsCid: { type: String, default: '' },
        dtiSecCdaIpfsCid: { type: String, default: '' },
        leaseOrLandTitleIpfsCid: { type: String, default: '' },
        occupancyPermitIpfsCid: { type: String, default: '' },
        healthCertificateIpfsCid: { type: String, default: '' }
      },
      birRegistration: {
        registrationNumber: { type: String, default: '' }, // Deprecated
        certificateUrl: { type: String, default: '' }, // Legacy: local file URL (for backward compatibility)
        registrationFee: { type: Number, default: 500 }, // Deprecated
        documentaryStampTax: { type: Number, default: 0 }, // Deprecated
        businessCapital: { type: Number, default: 0 }, // Deprecated
        booksOfAccountsUrl: { type: String, default: '' }, // Legacy: local file URL
        authorityToPrintUrl: { type: String, default: '' }, // Legacy: local file URL
        paymentReceiptUrl: { type: String, default: '' }, // Legacy: local file URL
        // IPFS CIDs for BIR documents
        certificateIpfsCid: { type: String, default: '' },
        booksOfAccountsIpfsCid: { type: String, default: '' },
        authorityToPrintIpfsCid: { type: String, default: '' },
        paymentReceiptIpfsCid: { type: String, default: '' }
      },
      otherAgencyRegistrations: {
        hasEmployees: { type: Boolean, default: false },
        sss: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }, // Legacy: local file URL
          proofIpfsCid: { type: String, default: '' } // IPFS CID for SSS proof
        },
        philhealth: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }, // Legacy: local file URL
          proofIpfsCid: { type: String, default: '' } // IPFS CID for PhilHealth proof
        },
        pagibig: {
          registered: { type: Boolean, default: false },
          proofUrl: { type: String, default: '' }, // Legacy: local file URL
          proofIpfsCid: { type: String, default: '' } // IPFS CID for Pag-IBIG proof
        }
      },
      submittedAt: { type: Date },
      submittedToLguOfficer: { type: Boolean, default: false },
      isSubmitted: { type: Boolean, default: false },
      // Business Renewal Applications
      renewals: [{
        renewalId: { type: String, required: true },
        renewalYear: { type: Number, required: true },
        renewalPeriodStart: { type: Date },
        renewalPeriodEnd: { type: Date },
        periodAcknowledged: { type: Boolean, default: false },
        periodAcknowledgedAt: { type: Date },
        grossReceipts: {
          amount: { type: Number, default: 0 },
          calendarYear: { type: Number },
          cy2025: { type: Number }, // Legacy field for backward compatibility
          excludesVat: { type: Boolean, default: true },
          excludesReturns: { type: Boolean, default: true },
          excludesUncollected: { type: Boolean, default: true },
          branchAllocations: [{
            branchName: { type: String, default: '' },
            branchLocation: { type: String, default: '' },
            grossReceipts: { type: Number, default: 0 }
          }]
        },
        renewalDocuments: {
          previousMayorsPermit: { type: String, default: '' },
          previousOfficialReceipt: { type: String, default: '' },
          auditedFinancialStatements: { type: String, default: '' },
          incomeTaxReturn: { type: String, default: '' },
          barangayClearance: { type: String, default: '' },
          ctc: { type: String, default: '' },
          fireSafetyInspection: { type: String, default: '' },
          sanitaryPermit: { type: String, default: '' },
          healthCertificate: { type: String, default: '' },
          businessInsurance: { type: String, default: '' },
          swornDeclaration: { type: String, default: '' },
          // IPFS CIDs for renewal documents
          previousMayorsPermitIpfsCid: { type: String, default: '' },
          previousOfficialReceiptIpfsCid: { type: String, default: '' },
          auditedFinancialStatementsIpfsCid: { type: String, default: '' },
          incomeTaxReturnIpfsCid: { type: String, default: '' },
          barangayClearanceIpfsCid: { type: String, default: '' },
          ctcIpfsCid: { type: String, default: '' },
          fireSafetyInspectionIpfsCid: { type: String, default: '' },
          sanitaryPermitIpfsCid: { type: String, default: '' },
          healthCertificateIpfsCid: { type: String, default: '' },
          businessInsuranceIpfsCid: { type: String, default: '' },
          swornDeclarationIpfsCid: { type: String, default: '' }
        },
        assessment: {
          localBusinessTax: { type: Number, default: 0 },
          mayorsPermitFee: { type: Number, default: 0 },
          barangayClearanceFee: { type: Number, default: 0 },
          communityTax: { type: Number, default: 0 },
          fireSafetyInspectionFee: { type: Number, default: 0 },
          sanitaryPermitFee: { type: Number, default: 0 },
          garbageFee: { type: Number, default: 0 },
          environmentalFee: { type: Number, default: 0 },
          otherFees: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
          calculatedAt: { type: Date }
        },
        payment: {
          status: { 
            type: String, 
            enum: ['pending', 'paid', 'failed'], 
            default: 'pending' 
          },
          amount: { type: Number, default: 0 },
          paymentMethod: { type: String, default: '' },
          transactionId: { type: String, default: '' },
          paidAt: { type: Date }
        },
        renewalStatus: { 
          type: String, 
          enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'], 
          default: 'draft' 
        },
        submittedAt: { type: Date },
        referenceNumber: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }],
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
