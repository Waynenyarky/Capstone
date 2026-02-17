const mongoose = require('mongoose')
const { BUSINESS_TYPE_VALUES } = require('../../../../shared/constants')

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // Step 2: Owner Identity Information
    ownerIdentity: {
      fullName: { type: String, default: '' },
      dateOfBirth: { type: Date },
      idType: { type: String, default: '' },
      idNumber: { type: String, default: '' },
      idFileUrl: { type: String, default: '' },
      idFileBackUrl: { type: String, default: '' },
      idFileIpfsCid: { type: String, default: '' },
      isSubmitted: { type: Boolean, default: false },
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
      businessStatus: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active' },
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
        enum: BUSINESS_TYPE_VALUES,
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

      // ── Phase 2: Unified Business Permit Form fields (2B) ──
      applicationType: {
        type: String,
        enum: ['', 'new', 'renewal', 'amendment', 'additional'],
        default: 'new',
      },
      organizationType: {
        type: String,
        enum: ['', 'sole_proprietorship', 'partnership', 'corporation', 'cooperative'],
        default: '',
      },
      businessPlateNo: { type: String, default: '' },
      yearEstablished: { type: Number, default: null },
      // Business address extra fields
      houseBldgNo: { type: String, default: '' },
      buildingName: { type: String, default: '' },
      subdivision: { type: String, default: '' },
      blockCode: { type: String, default: '' },
      pin: { type: String, default: '' },
      buildingRegistryNo: { type: String, default: '' },
      businessAreaSqm: { type: Number, default: 0 },
      totalEmployees: { type: Number, default: 0 },
      employeesResidingInLgu: { type: Number, default: 0 },
      // Owner address
      ownerAddress: {
        street: { type: String, default: '' },
        barangay: { type: String, default: '' },
        city: { type: String, default: '' },
        province: { type: String, default: '' },
        zipCode: { type: String, default: '' },
      },
      // Lessor info (if renting)
      lessorInfo: {
        name: { type: String, default: '' },
        businessAddress: { type: String, default: '' },
      },
      // Emergency contact
      emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relationship: { type: String, default: '' },
      },
      // President/Treasurer (for corporation/cooperative)
      presidentName: { type: String, default: '' },
      treasurerName: { type: String, default: '' },
      // Business Activities (multiple rows)
      businessActivities: [{
        taxCode: { type: String, default: '' },
        lineOfBusiness: { type: String, default: '' },
        detailedLine: { type: String, default: '' },
        psicCode: { type: String, default: '' },
        grossSales: { type: Number, default: 0 },
        _id: false,
      }],
      // Capital & Financial
      capital: {
        initialBuilding: { type: Number, default: 0 },
        mev: [{ description: { type: String }, amount: { type: Number, default: 0 }, _id: false }],
        equity: { type: Number, default: 0 },
        payable: { type: Number, default: 0 },
      },
      // Accreditations
      accreditations: {
        dtiSecCda: { type: String, default: '' },
        nfa: { type: String, default: '' },
        bfad: { type: String, default: '' },
        bir: { type: String, default: '' },
        tin: { type: String, default: '' },
        other: { type: String, default: '' },
      },
      oathOfUndertaking: { type: Boolean, default: false },

      // ── Phase 2: Retirement / Cessation fields (2F) ──
      retirementStatus: {
        type: String,
        enum: ['', 'requested', 'inspector_verified', 'confirmed', 'rejected'],
        default: '',
      },
      retirementRequestedAt: { type: Date, default: null },
      retirementApplicationLetter: { type: String, default: '' }, // URL or text
      swornStatementGrossSales: { type: Number, default: 0 },
      yearsActive: { type: Number, default: 0 },
      inspectorVerifiedClosed: { type: Boolean, default: false },
      inspectorVerifiedAt: { type: Date, default: null },
      retirementConfirmedAt: { type: Date, default: null },
      retirementRejectionReason: { type: String, default: '' },

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
      // LGU documents: Mixed so form-definition-driven keys (from admin) are persisted; legacy keys (idPicture, ctc, etc.) still work
      lguDocuments: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
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
