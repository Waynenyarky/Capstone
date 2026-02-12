/**
 * Seed Form Definitions Migration
 *
 * Seeds FormGroup + FormDefinition collections with realistic Philippine
 * government business registration requirements for all 21 PSIC 2019 sections.
 *
 * Usage: node seedFormDefinitions.js
 *
 * Can also be called programmatically via seedIfEmpty() during startup.
 *
 * Requires: MONGO_URI environment variable (when run standalone)
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: require('path').join(__dirname, '..', '..', '.env') })

const FormDefinition = require('../models/FormDefinition')
const FormGroup = require('../models/FormGroup')
const { INDUSTRY_SCOPE_LABELS } = require('../../../../shared/constants')

const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001')

// ─── Helper: create a requirement item with full field type info ────
function item(label, type = 'file', opts = {}) {
  return {
    label,
    type,
    key: opts.key || '',
    required: opts.required !== undefined ? opts.required : true,
    notes: opts.notes || opts.helpText || '',
    helpText: opts.helpText || '',
    placeholder: opts.placeholder || '',
    span: opts.span || 24,
    validation: opts.validation || {},
    dropdownSource: opts.dropdownSource || 'static',
    dropdownOptions: opts.dropdownOptions || [],
    ...(type === 'download' ? {
      downloadFileName: opts.downloadFileName || '',
      downloadFileSize: opts.downloadFileSize || 0,
      downloadFileType: opts.downloadFileType || 'pdf',
      downloadFileUrl: opts.downloadFileUrl || '',
    } : {}),
  }
}

// ─── GLOBAL Registration Requirements (applicable to ALL industries) ──────
const globalRegistrationSections = [
  {
    category: 'Local Government Unit (LGU)',
    source: 'BPLO',
    notes: 'Requirements from the Business Permits and Licensing Office',
    items: [
      item('Duly accomplished application form', 'download', {
        helpText: 'Download this form, fill it out, then upload the completed version',
        downloadFileName: 'business-permit-application.pdf',
        downloadFileSize: 245760,
        downloadFileType: 'pdf',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Two 2×2 ID photos', 'file', {
        helpText: 'Recent passport-sized photos with white background',
        validation: { acceptedFileTypes: 'jpg,png', maxFileSize: 5 },
      }),
      item('Valid government-issued IDs of the business owner', 'file', {
        helpText: 'Upload a clear scan or photo of a valid government-issued ID (e.g. Philippine passport, driver\'s license, SSS UMID, PhilSys national ID)',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Barangay Business Clearance', 'file', {
        helpText: 'Obtained from the Barangay Hall where the business is located',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Occupancy Permit', 'file', {
        required: false,
        helpText: 'Required for establishments with physical premises; issued by the Building Official',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Fire Safety Inspection Certificate (FSIC)', 'file', {
        helpText: 'Issued by the Bureau of Fire Protection (BFP) after fire safety inspection',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Community Tax Certificate (CTC / Cedula)', 'file', {
        helpText: 'Obtainable from City/Municipal Treasurer\'s Office',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Lease contract or land title', 'file', {
        required: false,
        helpText: 'Proof of right to use the business premises (lease, contract of sale, or land title)',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
  {
    category: 'Bureau of Internal Revenue (BIR)',
    source: 'BIR',
    notes: 'Tax registration requirements from the BIR Revenue District Office',
    items: [
      item("Mayor's permit or proof of ongoing LGU application", 'file', {
        helpText: 'Copy of the business permit or official receipt of application',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('DTI / SEC / CDA Certificate of Registration', 'file', {
        helpText: 'DTI for sole proprietorship, SEC for corporation/partnership, CDA for cooperatives',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Barangay Clearance', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('BIR Form 1901 / 1903 (Registration form)', 'download', {
        helpText: 'BIR Form 1901 for self-employed / professionals; 1903 for corporations',
        downloadFileName: 'bir-form-1901.pdf',
        downloadFileSize: 350000,
        downloadFileType: 'pdf',
        validation: { acceptedFileTypes: 'pdf', maxFileSize: 10 },
      }),
    ],
  },
  {
    category: 'Business Information',
    source: '',
    notes: 'Basic business details collected during registration',
    items: [
      item('Registered business name', 'text', {
        helpText: 'As registered with DTI/SEC/CDA',
        placeholder: 'Enter registered business name',
        validation: { minLength: 2, maxLength: 200 },
      }),
      item('Business type / industry classification', 'select', {
        helpText: 'Select the PSIC industry classification',
        placeholder: 'Select industry',
        dropdownSource: 'industries',
      }),
      item('Business address', 'address', {
        helpText: 'Philippine address using PSGC standard geographic codes',
      }),
      item('Date of establishment', 'date', {
        span: 12,
      }),
      item('Number of employees', 'number', {
        placeholder: 'e.g. 5',
        validation: { minValue: 1 },
        span: 12,
      }),
      item('Brief description of business activities', 'textarea', {
        required: false,
        helpText: 'Describe the main products or services offered',
        placeholder: 'Describe your business...',
        validation: { maxLength: 1000 },
      }),
    ],
  },
  {
    category: 'Other Government Agencies',
    source: '',
    notes: 'Mandatory employer registrations (if applicable)',
    items: [
      item('Social Security System (SSS) Employer Registration', 'file', {
        required: false,
        helpText: 'Required if business has employees; SSS Form R-1',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('PhilHealth Employer Registration', 'file', {
        required: false,
        helpText: 'Required if business has employees',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Pag-IBIG Fund Employer Registration', 'file', {
        required: false,
        helpText: 'Required if business has employees',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Global Renewal Requirements ──────────────────────────────────
const globalRenewalSections = [
  {
    category: 'Renewal Documents',
    source: 'BPLO',
    notes: 'Annual business permit renewal',
    items: [
      item('Sworn Statement of Gross Sales/Receipts (Notarized)', 'download', {
        helpText: 'Download the form, have it notarized, then upload',
        downloadFileName: 'sworn-statement-gross-sales.pdf',
        downloadFileSize: 180000,
        downloadFileType: 'pdf',
        validation: { acceptedFileTypes: 'pdf', maxFileSize: 10 },
      }),
      item('Previous year Business Permit (photocopy)', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Updated DTI/SEC/CDA registration', 'file', {
        required: false,
        helpText: 'Only if registration has been renewed or amended',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Barangay Business Clearance (current year)', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Community Tax Certificate (current year)', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Tax Clearance from City Treasurer', 'file', {
        helpText: 'Proof that real property and business taxes are paid',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Fire Safety Inspection Certificate (current year)', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Global Cessation Requirements ────────────────────────────────
const globalCessationSections = [
  {
    category: 'Cessation / Closure Documents',
    source: 'BPLO',
    notes: 'Requirements for business closure or cessation',
    items: [
      item('Affidavit of Closure (Notarized)', 'download', {
        helpText: 'Sworn statement declaring the closure of the business',
        downloadFileName: 'affidavit-of-closure.pdf',
        downloadFileSize: 120000,
        downloadFileType: 'pdf',
        validation: { acceptedFileTypes: 'pdf', maxFileSize: 10 },
      }),
      item('Original Business Permit (or affidavit of loss)', 'file', {
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Tax Clearance Certificate', 'file', {
        helpText: 'From City/Municipal Treasurer confirming all taxes are paid',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('BIR Certificate of Registration (Form 2303) with cancellation stamp', 'file', {
        helpText: 'Request BIR to cancel your TIN registration',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Employee separation clearance', 'file', {
        required: false,
        helpText: 'DOLE clearance if employees were separated',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('SSS / PhilHealth / Pag-IBIG contribution clearance', 'file', {
        required: false,
        helpText: 'Proof all employer contributions are settled',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Global Appeal Requirements ───────────────────────────────────
const globalAppealSections = [
  {
    category: 'Appeal Information',
    source: 'BPLO',
    notes: 'Requirements for appealing a permit or registration decision',
    items: [
      item('Appeal type', 'select', {
        helpText: 'Select the type of appeal',
        placeholder: 'Select appeal type',
        dropdownOptions: ['Denial of permit', 'Revocation', 'Penalty dispute', 'Other'],
      }),
      item('Reference number (permit or application)', 'text', {
        helpText: 'Application or permit reference number being appealed',
        placeholder: 'e.g. BPLO-2026-001234',
        validation: { minLength: 1, maxLength: 100 },
      }),
      item('Reason for appeal', 'textarea', {
        helpText: 'Explain why you are appealing this decision',
        placeholder: 'Describe your grounds for appeal...',
        validation: { minLength: 10, maxLength: 2000 },
      }),
      item('Supporting documents', 'file', {
        key: 'supportingDocuments',
        helpText: 'Upload any evidence or documents that support your appeal',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Global Violation Requirements ────────────────────────────────
const globalViolationSections = [
  {
    category: 'Violation Report',
    source: 'BPLO',
    notes: 'Requirements for reporting or documenting violations',
    items: [
      item('Violation type', 'select', {
        helpText: 'Category of violation',
        placeholder: 'Select type',
        dropdownOptions: ['Operating without permit', 'Address change not reported', 'Business name change not reported', 'Other'],
      }),
      item('Description', 'textarea', {
        helpText: 'Describe the violation and circumstances',
        placeholder: 'Describe the violation...',
        validation: { minLength: 10, maxLength: 2000 },
      }),
      item('Evidence or attachments', 'file', {
        key: 'evidenceAttachments',
        required: false,
        helpText: 'Photos or documents as evidence',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Global Inspections Requirements (staff/inspector use only) ─────
const globalInspectionsSections = [
  {
    category: 'Inspection Checklist',
    source: 'BPLO',
    notes: 'Requirements and checklist items for conducting inspections',
    items: [
      item('Inspection date', 'date', { span: 12 }),
      item('Inspector name', 'text', {
        placeholder: 'Full name of inspector',
        validation: { minLength: 2, maxLength: 200 },
        span: 12,
      }),
      item('Compliance status', 'select', {
        helpText: 'Overall compliance result',
        placeholder: 'Select status',
        dropdownOptions: ['Compliant', 'Non-compliant', 'Partial', 'Pending'],
      }),
      item('Findings / remarks', 'textarea', {
        required: false,
        placeholder: 'Inspection findings and remarks',
        validation: { maxLength: 2000 },
      }),
      item('Inspection report or photos', 'file', {
        key: 'inspectionReport',
        required: false,
        helpText: 'Upload inspection report or supporting photos',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
]

// ─── Industry-specific sections (PSIC 2019 letters a–u) ──────────
const industrySections = {
  a: [ // Agriculture, forestry and fishing
    {
      category: 'Agriculture / Fishery / Forestry Permits',
      source: 'DA',
      notes: 'Department of Agriculture and related agency requirements',
      items: [
        item('Bureau of Fisheries and Aquatic Resources (BFAR) permit', 'file', {
          required: false,
          helpText: 'Required for fishing, aquaculture, and fish trading businesses',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DA / Bureau of Plant Industry (BPI) phytosanitary certificate', 'file', {
          required: false,
          helpText: 'Required for plant nurseries, seed dealers, and agricultural product exporters',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DENR permit for forestry activities', 'file', {
          required: false,
          helpText: 'Required for logging, wood processing, and NTFP collection',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Fertilizer and Pesticide Authority (FPA) license', 'file', {
          required: false,
          helpText: 'Required for dealers/distributors of fertilizers and pesticides',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  b: [ // Mining and quarrying
    {
      category: 'Mining and Quarrying Permits',
      source: 'MGB',
      notes: 'Mines and Geosciences Bureau requirements',
      items: [
        item('Mineral Production Sharing Agreement (MPSA) or permit', 'file', {
          helpText: 'Issued by the DENR-MGB',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Environmental Compliance Certificate (ECC)', 'file', {
          helpText: 'Required for all mining operations per DAO 2003-30',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Provincial / Municipal extraction permit (quarrying)', 'file', {
          required: false,
          helpText: 'Required for sand, gravel, and quarry operations',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  c: [ // Manufacturing
    {
      category: 'Manufacturing / Industrial Compliance',
      source: 'DENR',
      notes: 'Environmental and safety requirements for manufacturing',
      items: [
        item('DENR Environmental Compliance Certificate (ECC)', 'file', {
          required: false,
          helpText: 'Required for environmentally critical projects (ECP) or projects in ECAs',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Pollution Control Officer (PCO) accreditation', 'file', {
          required: false,
          helpText: 'Factories generating pollution must designate an accredited PCO',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Waste disposal agreement or proof of disposal service', 'file', {
          helpText: 'Contract with a DENR-accredited waste hauler/treatment facility',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('FDA License to Operate (LTO)', 'file', {
          required: false,
          helpText: 'Required for food, drug, cosmetic, and medical device manufacturers',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DOLE safety compliance certificate', 'file', {
          required: false,
          helpText: 'Required for factories with hazardous work environments per DO 198-18',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  d: [ // Electricity, gas, steam
    {
      category: 'Energy Sector Permits',
      source: 'DOE',
      notes: 'Department of Energy and Energy Regulatory Commission requirements',
      items: [
        item('DOE Certificate of Compliance', 'file', {
          helpText: 'Required for power generation, distribution, and retail electricity suppliers',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('ERC franchise / Certificate of Public Convenience', 'file', {
          required: false,
          helpText: 'For distribution utilities and retail electricity suppliers',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Environmental Compliance Certificate (ECC)', 'file', {
          required: false,
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  e: [ // Water supply, sewerage, waste management
    {
      category: 'Water / Waste Management Permits',
      source: 'DENR',
      notes: 'Environmental management requirements',
      items: [
        item('DENR Discharge Permit', 'file', {
          helpText: 'Required for wastewater discharge per DAO 2016-08',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DENR Hazardous Waste Generator ID', 'file', {
          required: false,
          helpText: 'Required for businesses generating hazardous waste (RA 6969)',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Water permit from NWRB', 'file', {
          required: false,
          helpText: 'National Water Resources Board permit for water extraction/supply',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Environmental Compliance Certificate (ECC)', 'file', {
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  f: [ // Construction
    {
      category: 'Construction Permits and Licenses',
      source: 'PCAB',
      notes: 'Philippine Contractors Accreditation Board and related requirements',
      items: [
        item('PCAB License', 'file', {
          required: false,
          helpText: 'Required for contractors; classification determines allowable project value',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Building Permit', 'file', {
          required: false,
          helpText: 'From the LGU Building Official, required before starting construction',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Professional Regulation Commission (PRC) licenses', 'file', {
          required: false,
          helpText: 'Engineer/Architect licenses for regulated design and construction work',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Environmental Compliance Certificate (ECC)', 'file', {
          required: false,
          helpText: 'Required for environmentally critical construction projects',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  g: [ // Wholesale and retail trade
    {
      category: 'Trade and Commerce Requirements',
      source: 'DTI',
      notes: 'Department of Trade and Industry requirements',
      items: [
        item('DTI Business Name Registration Certificate', 'file', {
          helpText: 'Sole proprietorship registration from DTI',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Product standards certification (if applicable)', 'file', {
          required: false,
          helpText: 'Philippine Standard (PS) or Import Commodity Clearance (ICC) mark for regulated products',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('FDA product registration (if food/drugs/cosmetics)', 'file', {
          required: false,
          helpText: 'Certificate of Product Registration (CPR) from FDA',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  h: [ // Transport and storage
    {
      category: 'Transportation and Logistics Permits',
      source: 'LTFRB',
      notes: 'Land Transportation Franchising and Regulatory Board requirements',
      items: [
        item('LTFRB Certificate of Public Convenience (CPC)', 'file', {
          required: false,
          helpText: 'Required for public utility vehicles (buses, jeepneys, UV express, taxis, TNVS)',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('LTO vehicle registration (OR/CR)', 'file', {
          helpText: 'Official receipt and certificate of registration for each vehicle',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Professional driver license copies', 'file', {
          helpText: 'Professional driver\'s license with appropriate restriction code',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('CAB permit (for airlines)', 'file', {
          required: false,
          helpText: 'Civil Aeronautics Board permit for domestic/international air transport',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('MARINA registration (for maritime transport)', 'file', {
          required: false,
          helpText: 'Maritime Industry Authority registration for shipping/maritime businesses',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  i: [ // Accommodation and food service
    {
      category: 'Food Safety and Sanitation',
      source: 'CHO',
      notes: 'City/Municipal Health Office and FDA requirements',
      items: [
        item('Sanitary Permit', 'file', {
          helpText: 'Issued by the City/Municipal Health Office after sanitary inspection',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Health certificates for food handlers', 'file', {
          helpText: 'Individual health certificates for all food-handling employees',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Food Safety Training Certificate', 'file', {
          required: false,
          helpText: 'Required for food handlers per FDA Circular 2013-010',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('FDA License to Operate (LTO)', 'file', {
          required: false,
          helpText: 'Required for food manufacturers, food supplement distributors',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DOT Accreditation (for accommodation)', 'file', {
          required: false,
          helpText: 'Department of Tourism accreditation for hotels, resorts, inns',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  j: [ // Information and communication
    {
      category: 'ICT and Telecommunications Permits',
      source: 'NTC',
      notes: 'National Telecommunications Commission requirements',
      items: [
        item('NTC franchise/permit (for telecom operators)', 'file', {
          required: false,
          helpText: 'Required for telecommunications providers and value-added service providers',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('NPC registration (data processing)', 'file', {
          required: false,
          helpText: 'National Privacy Commission registration for personal information controllers/processors under RA 10173',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  k: [ // Financial and insurance activities
    {
      category: 'Financial Regulatory Requirements',
      source: 'BSP',
      notes: 'Bangko Sentral ng Pilipinas, SEC, and Insurance Commission requirements',
      items: [
        item('SEC Registration and Articles of Incorporation', 'file', {
          helpText: 'Securities and Exchange Commission corporate registration',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('BSP license/authority to operate (banking)', 'file', {
          required: false,
          helpText: 'Required for banks, quasi-banks, trust entities, and money service businesses',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Insurance Commission (IC) license', 'file', {
          required: false,
          helpText: 'Required for insurance companies, brokers, and agents',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('AMLC registration (anti-money laundering)', 'file', {
          required: false,
          helpText: 'Registration with the Anti-Money Laundering Council for covered institutions',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  l: [ // Real estate activities
    {
      category: 'Real Estate Licenses',
      source: 'PRC',
      notes: 'Professional Regulation Commission and HLURB requirements',
      items: [
        item('PRC Real Estate Broker license', 'file', {
          required: false,
          helpText: 'Required for real estate brokerage per RA 9646',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DHSUD (HLURB) License to Sell', 'file', {
          required: false,
          helpText: 'Required for real estate developers selling subdivision lots or condominium units',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  m: [ // Professional, scientific and technical activities
    {
      category: 'Professional Licenses',
      source: 'PRC',
      notes: 'Professional Regulation Commission requirements',
      items: [
        item('PRC Professional License (applicable profession)', 'file', {
          helpText: 'E.g. CPA, lawyer, engineer, architect, doctor, etc.',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Professional Tax Receipt (PTR)', 'file', {
          helpText: 'Annual professional tax paid to the LGU',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  n: [ // Administrative and support service activities
    {
      category: 'Support Services Requirements',
      source: 'DOLE',
      notes: 'Department of Labor and Employment requirements',
      items: [
        item('DOLE registration (for manpower agencies)', 'file', {
          required: false,
          helpText: 'Required for private recruitment and placement agencies per DO 174-17',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Private Security Agency License (PSAGC)', 'file', {
          required: false,
          helpText: 'Required for private security agencies, per RA 5487',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  o: [ // Public administration and defence
    {
      category: 'Government-Related Business Requirements',
      source: 'GPPB',
      notes: 'Government Procurement Policy Board requirements',
      items: [
        item('PhilGEPS registration', 'file', {
          required: false,
          helpText: 'Philippine Government Electronic Procurement System registration for government suppliers',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  p: [ // Education
    {
      category: 'Educational Institution Requirements',
      source: 'DepEd',
      notes: 'Department of Education, CHED, or TESDA requirements',
      items: [
        item('DepEd permit/recognition (basic education)', 'file', {
          required: false,
          helpText: 'Required for private schools offering K-12 programs',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('CHED permit/recognition (higher education)', 'file', {
          required: false,
          helpText: 'Required for colleges and universities',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('TESDA registration (technical-vocational)', 'file', {
          required: false,
          helpText: 'Required for technical-vocational training institutions',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  q: [ // Human health and social work activities
    {
      category: 'Health Facility Licenses',
      source: 'DOH',
      notes: 'Department of Health requirements',
      items: [
        item('DOH License to Operate (LTO) health facility', 'file', {
          helpText: 'Required for hospitals, clinics, laboratories, pharmacies, etc.',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('PRC licenses for healthcare professionals', 'file', {
          helpText: 'Physician, nurse, pharmacist, medical technologist, etc.',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Dangerous Drugs Board (DDB) license (pharmacies)', 'file', {
          required: false,
          helpText: 'Required for pharmacies handling regulated drugs per RA 9165',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DSWD license (social work institutions)', 'file', {
          required: false,
          helpText: 'Required for social welfare agencies, child-caring institutions',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  r: [ // Arts, entertainment and recreation
    {
      category: 'Entertainment and Recreation Permits',
      source: 'LGU',
      notes: 'Local government and tourism requirements',
      items: [
        item('Special Permit for amusement/entertainment (LGU)', 'file', {
          required: false,
          helpText: 'Required for bars, KTV, gaming, amusement arcades, resorts, etc.',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DOT accreditation (tourism-related)', 'file', {
          required: false,
          helpText: 'Department of Tourism accreditation for tourism enterprises',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('PAGCOR license (gaming operations)', 'file', {
          required: false,
          helpText: 'Philippine Amusement and Gaming Corporation license for gaming establishments',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  s: [ // Other service activities
    {
      category: 'Service-Specific Permits',
      source: 'LGU',
      notes: 'Requirements vary based on specific service type',
      items: [
        item('Special permit for personal care services', 'file', {
          required: false,
          helpText: 'E.g. beauty salons, barbershops, laundry services, funeral services',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('DENR permit (automotive repair / car wash)', 'file', {
          required: false,
          helpText: 'Environmental permit for wastewater-generating service activities',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  t: [ // Activities of households as employers
    {
      category: 'Household Employer Requirements',
      source: 'DOLE',
      notes: 'Domestic worker (Kasambahay) law compliance',
      items: [
        item('Kasambahay employment contract', 'download', {
          helpText: 'Standardized employment contract per RA 10361 (Batas Kasambahay)',
          downloadFileName: 'kasambahay-employment-contract.pdf',
          downloadFileSize: 85000,
          downloadFileType: 'pdf',
          validation: { acceptedFileTypes: 'pdf', maxFileSize: 10 },
        }),
        item('SSS / PhilHealth / Pag-IBIG registration for domestic worker', 'file', {
          helpText: 'Employer must register domestic workers with mandatory agencies',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
  u: [ // Extraterritorial organizations
    {
      category: 'Extraterritorial / International Organization Requirements',
      source: 'DFA',
      notes: 'Department of Foreign Affairs and SEC requirements',
      items: [
        item('SEC registration as foreign corporation', 'file', {
          required: false,
          helpText: 'License to do business in the Philippines for foreign entities',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
        item('Special Investor Resident Visa (SIRV) or related visa', 'file', {
          required: false,
          helpText: 'For foreign nationals representing the organization',
          validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        }),
      ],
    },
  ],
}

// ─── Seed function ────────────────────────────────────────────────
async function createFormGroupAndDefinition({ formType, industryScope, sections, version = '2026.1', now }) {
  const scopeLabel = industryScope === 'all' ? 'All Industries' : (INDUSTRY_SCOPE_LABELS[industryScope] || industryScope)
  const typeLabels = {
    registration: 'Business Registration',
    permit: 'Business Permit',
    renewal: 'Business Renewal',
    cessation: 'Cessation',
    violation: 'Violation',
    appeal: 'Appeal',
    inspections: 'Inspections',
  }
  const displayName = `${typeLabels[formType] || formType} - ${scopeLabel}`

  const group = await FormGroup.create({
    formType,
    industryScope,
    displayName,
  })

  const businessTypes = industryScope === 'all' ? [] : [industryScope]
  const definition = await FormDefinition.create({
    formGroupId: group._id,
    formType,
    version,
    industryScope,
    name: displayName,
    description: `Philippine government ${typeLabels[formType] || formType} requirements for ${scopeLabel}.`,
    status: 'published',
    businessTypes,
    lguCodes: [],
    sections,
    downloads: [],
    effectiveFrom: now,
    effectiveTo: null,
    publishedAt: now,
    publishedBy: SYSTEM_USER_ID,
    createdBy: SYSTEM_USER_ID,
    updatedBy: SYSTEM_USER_ID,
    changeLog: [
      { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Seeded from Philippine government requirements' } },
      { action: 'published', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Auto-published as seed data' } },
    ],
  })

  return { group, definition }
}

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || ''
  if (!mongoUri) {
    console.error('Error: MONGO_URI environment variable is required')
    process.exit(1)
  }

  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const existingCount = await FormDefinition.countDocuments({})
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing form definitions. Skipping seed.`)
      console.log('To re-seed, drop the FormDefinition and FormGroup collections first.')
      await mongoose.disconnect()
      return
    }

    const now = new Date()
    let count = 0
    const psicSections = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u']

    // === Global Registration ===
    await createFormGroupAndDefinition({
      formType: 'registration',
      industryScope: 'all',
      sections: globalRegistrationSections,
      now,
    })
    console.log('  Created: Registration - All Industries (global)')
    count++

    // === Industry-specific Registration ===
    for (const psic of psicSections) {
      const extra = industrySections[psic] || []
      const sections = [...globalRegistrationSections, ...extra]
      await createFormGroupAndDefinition({
        formType: 'registration',
        industryScope: psic,
        sections,
        now,
      })
      const label = INDUSTRY_SCOPE_LABELS[psic] || psic
      console.log(`  Created: Registration - ${label}`)
      count++
    }

    // === Global Renewal ===
    await createFormGroupAndDefinition({
      formType: 'renewal',
      industryScope: 'all',
      sections: globalRenewalSections,
      now,
    })
    console.log('  Created: Renewal - All Industries (global)')
    count++

    // === Global Cessation ===
    await createFormGroupAndDefinition({
      formType: 'cessation',
      industryScope: 'all',
      sections: globalCessationSections,
      now,
    })
    console.log('  Created: Cessation - All Industries (global)')
    count++

    // === Global Appeal ===
    await createFormGroupAndDefinition({
      formType: 'appeal',
      industryScope: 'all',
      sections: globalAppealSections,
      now,
    })
    console.log('  Created: Appeal - All Industries (global)')
    count++

    // === Global Violation ===
    await createFormGroupAndDefinition({
      formType: 'violation',
      industryScope: 'all',
      sections: globalViolationSections,
      now,
    })
    console.log('  Created: Violation - All Industries (global)')
    count++

    // === Global Inspections (staff/inspector only; not on public API) ===
    await createFormGroupAndDefinition({
      formType: 'inspections',
      industryScope: 'all',
      sections: globalInspectionsSections,
      now,
    })
    console.log('  Created: Inspections - All Industries (global)')
    count++

    console.log(`\nSeed completed! Total definitions created: ${count}`)
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (error) {
    console.error('Seed failed:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

/**
 * Seed form definitions if the collection is empty.
 * Safe to call during startup - will not duplicate data.
 * Assumes mongoose is already connected.
 */
async function seedIfEmpty() {
  try {
    const existingCount = await FormDefinition.countDocuments({})
    if (existingCount > 0) {
      console.log(`[FormDefinitions] ${existingCount} definitions already exist. Skipping seed.`)
      return { seeded: false, count: existingCount }
    }

    console.log('[FormDefinitions] No definitions found. Seeding initial data...')
    const now = new Date()
    let count = 0
    const psicSections = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u']

    // Global registration
    await createFormGroupAndDefinition({ formType: 'registration', industryScope: 'all', sections: globalRegistrationSections, now })
    count++

    // Industry-specific registration
    for (const psic of psicSections) {
      const extra = industrySections[psic] || []
      await createFormGroupAndDefinition({ formType: 'registration', industryScope: psic, sections: [...globalRegistrationSections, ...extra], now })
      count++
    }

    // Global renewal
    await createFormGroupAndDefinition({ formType: 'renewal', industryScope: 'all', sections: globalRenewalSections, now })
    count++

    // Global cessation
    await createFormGroupAndDefinition({ formType: 'cessation', industryScope: 'all', sections: globalCessationSections, now })
    count++

    // Global appeal, violation, inspections
    await createFormGroupAndDefinition({ formType: 'appeal', industryScope: 'all', sections: globalAppealSections, now })
    count++
    await createFormGroupAndDefinition({ formType: 'violation', industryScope: 'all', sections: globalViolationSections, now })
    count++
    await createFormGroupAndDefinition({ formType: 'inspections', industryScope: 'all', sections: globalInspectionsSections, now })
    count++

    console.log(`[FormDefinitions] Seeded ${count} form definitions successfully.`)
    return { seeded: true, count }
  } catch (error) {
    console.error('[FormDefinitions] Seed failed:', error.message)
    return { seeded: false, error: error.message }
  }
}

if (require.main === module) {
  seed()
}

module.exports = {
  seed,
  seedIfEmpty,
  SYSTEM_USER_ID,
  globalRegistrationSections,
  globalRenewalSections,
  globalCessationSections,
  globalAppealSections,
  globalViolationSections,
  globalInspectionsSections,
  industrySections,
}
