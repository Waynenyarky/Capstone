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
  const base = {
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
  }
  if (type === 'download') {
    base.downloadFileName = opts.downloadFileName || ''
    base.downloadFileSize = opts.downloadFileSize || 0
    base.downloadFileType = opts.downloadFileType || 'pdf'
    base.downloadFileUrl = opts.downloadFileUrl || ''
  }
  if (type === 'repeatable_group') {
    base.groupFields = opts.groupFields || []
    base.minRows = opts.minRows ?? 1
    base.maxRows = opts.maxRows ?? 20
  }
  return base
}

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

// ─── Unified Business Permit Form (per BPLO unified form requirement) ─────
// Based on Alaminos City BPLO unified business permit form and Immediate_Requirements.md.
// All businesses fill this single form; business activity section drives fee computation.
// Applicant/owner details come from PIS (account registration); no separate section here.
const unifiedBusinessPermitSections = [
  {
    category: 'Required Documents',
    source: 'BPLO',
    notes: 'Supporting documents for the unified business permit application. Applicant/owner details are taken from the PIS (account registration).',
    items: [
      item('Valid government-issued ID of the business owner', 'file', {
        key: 'ownerGovernmentId',
        helpText: 'Upload a clear scan or photo of a valid government-issued ID (e.g. Philippine passport, driver\'s license, SSS UMID, PhilSys national ID). Owner details are from your account.',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Barangay Business Clearance', 'file', {
        key: 'barangayClearance',
        helpText: 'Obtained from the Barangay Hall where the business is located',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('DTI / SEC / CDA Certificate of Registration', 'file', {
        key: 'dtiSecCdaCertificate',
        helpText: 'DTI for sole proprietorship, SEC for corporation/partnership, CDA for cooperatives',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Lease contract or land title', 'file', {
        key: 'leaseContractOrTitle',
        required: false,
        helpText: 'Proof of right to use the business premises (lease, contract of sale, or land title). Required if property is leased.',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Community Tax Certificate (CTC / Cedula)', 'file', {
        key: 'ctcCedula',
        helpText: 'Obtainable from City/Municipal Treasurer\'s Office',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Occupancy Permit', 'file', {
        key: 'occupancyPermit',
        required: false,
        helpText: 'Required for establishments with physical premises; issued by the Building Official',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
  {
    category: 'Business Information',
    source: 'BPLO',
    notes: 'Details about the business being registered or permitted',
    items: [
      item('Business / trade name', 'text', {
        key: 'businessName',
        helpText: 'As registered with DTI/SEC/CDA',
        placeholder: 'Enter business name',
        validation: { minLength: 2, maxLength: 200 },
      }),
      item('Business address', 'address', {
        key: 'businessAddress',
        helpText: 'Physical location of the business',
      }),
      item('Business telephone / mobile number', 'text', {
        key: 'businessPhone',
        required: false,
        placeholder: 'e.g. 09171234567',
        validation: { maxLength: 15 },
        span: 12,
      }),
      item('Business email', 'text', {
        key: 'businessEmail',
        required: false,
        placeholder: 'e.g. business@example.com',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Business area (sq. m.)', 'number', {
        key: 'businessArea',
        required: false,
        placeholder: 'e.g. 50',
        helpText: 'Total floor area in square meters',
        validation: { minValue: 0 },
        span: 12,
      }),
      item('Number of employees (male)', 'number', {
        key: 'employeesMale',
        required: false,
        placeholder: '0',
        validation: { minValue: 0 },
        span: 6,
      }),
      item('Number of employees (female)', 'number', {
        key: 'employeesFemale',
        required: false,
        placeholder: '0',
        validation: { minValue: 0 },
        span: 6,
      }),
      item('Total number of employees', 'number', {
        key: 'employeesTotal',
        placeholder: '0',
        validation: { minValue: 0 },
        span: 12,
      }),
      item('DTI / SEC / CDA registration number', 'text', {
        key: 'dtiSecCdaNumber',
        placeholder: 'Enter registration number',
        validation: { minLength: 1, maxLength: 100 },
        span: 12,
      }),
      item('Date of registration', 'date', {
        key: 'registrationDate',
        span: 12,
      }),
      item('TIN (Tax Identification Number)', 'text', {
        key: 'tin',
        placeholder: 'e.g. 123-456-789-000',
        validation: { minLength: 9, maxLength: 20 },
        span: 12,
      }),
      item('Type of organization', 'select', {
        key: 'organizationType',
        placeholder: 'Select type',
        dropdownOptions: ['Sole Proprietorship', 'Partnership', 'Corporation', 'Cooperative', 'Others'],
        span: 12,
      }),
    ],
  },
  {
    category: 'Business Activity',
    source: 'BPLO',
    notes: 'Tax code, line of business, and detailed line of business. These determine the fees the business must pay. Add one row per business activity.',
    items: [
      item('Business activities', 'repeatable_group', {
        key: 'businessActivities',
        helpText: 'Add one row for each business activity. Click "Add row" to add more.',
        groupFields: [
          {
            label: 'Tax code',
            type: 'select',
            key: 'taxCode',
            required: true,
            placeholder: 'Select tax code',
            helpText: 'Each code corresponds to a line of business category',
            span: 8,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: ['RET', 'WHL', 'FDS', 'MFG', 'SVC', 'FIN', 'RES', 'TRN', 'AGR', 'CON', 'MIN', 'UTL'],
          },
          {
            label: 'Line of business',
            type: 'select',
            key: 'lineOfBusiness',
            required: true,
            placeholder: 'Select line of business',
            helpText: 'The broad business category',
            span: 8,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: ['Retail', 'Wholesale', 'Food Service', 'Manufacturing', 'Services', 'Financial', 'Real Estate', 'Transportation', 'Agriculture', 'Construction', 'Mining', 'Utilities'],
          },
          {
            label: 'Detailed line of business',
            type: 'select',
            key: 'detailedLineOfBusiness',
            required: true,
            placeholder: 'Select detailed activity',
            helpText: 'e.g. Sari-sari store, Restaurant, Salon',
            span: 8,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: [],
          },
        ],
        minRows: 1,
        maxRows: 20,
      }),
    ],
  },
  {
    category: 'Ownership / Lease Information',
    source: 'BPLO',
    notes: 'Whether the business owner owns or leases the property',
    items: [
      item('Property ownership status', 'select', {
        key: 'propertyOwnership',
        helpText: 'Does the business owner own or lease the business premises?',
        placeholder: 'Select',
        dropdownOptions: ['Owned', 'Leased / Rented'],
        span: 12,
      }),
      item('Monthly rental (if leased)', 'number', {
        key: 'monthlyRental',
        required: false,
        placeholder: '0.00',
        helpText: 'Monthly rental amount in pesos (required if property is leased)',
        validation: { minValue: 0 },
        span: 12,
      }),
      item('Lessor name', 'text', {
        key: 'lessorName',
        required: false,
        placeholder: 'Full name of lessor / property owner',
        helpText: 'Required if property is leased',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Lessor address', 'address', {
        key: 'lessorAddress',
        required: false,
        helpText: 'Address of the lessor / property owner (required if leased)',
      }),
    ],
  },
  {
    category: 'Capital (Initial)',
    source: 'BPLO',
    notes: 'Building and list of machineries, equipment, and delivery vehicles used in the business.',
    items: [
      item('Building', 'number', {
        key: 'building',
        required: false,
        placeholder: '0.00',
        helpText: 'Declared value of building/structure in pesos',
        validation: { minValue: 0 },
        span: 12,
      }),
      item('Machineries / equipment / vehicles', 'repeatable_group', {
        key: 'machineriesEquipmentVehicles',
        helpText: 'Add one row for each machinery, equipment, or delivery vehicle. Click "Add row" to add more.',
        required: false,
        groupFields: [
          {
            label: 'Name / description',
            type: 'text',
            key: 'name',
            required: true,
            placeholder: 'e.g. Delivery truck, Generator, Oven',
            helpText: 'Name or description of the machinery/equipment/vehicle',
            span: 8,
            validation: { minLength: 1, maxLength: 200 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'Type',
            type: 'select',
            key: 'type',
            required: true,
            placeholder: 'Select type',
            helpText: '',
            span: 8,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: ['Machinery', 'Equipment', 'Delivery Vehicle', 'Other'],
          },
          {
            label: 'Quantity',
            type: 'number',
            key: 'quantity',
            required: true,
            placeholder: '1',
            helpText: '',
            span: 8,
            validation: { minValue: 1 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
        ],
        minRows: 0,
        maxRows: 50,
      }),
    ],
  },
  {
    category: 'Operating Capital',
    source: 'BPLO',
    notes: 'Owner must declare equity and payables for the business.',
    items: [
      item('Equity', 'number', {
        key: 'operatingCapitalEquity',
        required: false,
        placeholder: '0.00',
        helpText: 'Declared equity in pesos',
        validation: { minValue: 0 },
        span: 12,
      }),
      item('Payable', 'number', {
        key: 'operatingCapitalPayable',
        required: false,
        placeholder: '0.00',
        helpText: 'Declared payables in pesos',
        validation: { minValue: 0 },
        span: 12,
      }),
    ],
  },
  {
    category: 'Accreditation / License',
    source: 'BPLO',
    notes: 'List any accreditations, licenses, or special permits held by the business from government agencies.',
    items: [
      item('Accreditations / licenses', 'repeatable_group', {
        key: 'accreditationsLicenses',
        helpText: 'Add one row for each accreditation or license. Click "Add row" to add more.',
        required: false,
        groupFields: [
          {
            label: 'Issuing agency',
            type: 'text',
            key: 'issuingAgency',
            required: true,
            placeholder: 'e.g. DOH, FDA, DENR, PRC',
            helpText: 'Government agency that issued the accreditation or license',
            span: 8,
            validation: { minLength: 1, maxLength: 200 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'License / accreditation type',
            type: 'text',
            key: 'licenseType',
            required: true,
            placeholder: 'e.g. License to Operate, Sanitary Permit',
            helpText: 'Type or name of the license or accreditation',
            span: 8,
            validation: { minLength: 1, maxLength: 200 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'License number',
            type: 'text',
            key: 'licenseNumber',
            required: false,
            placeholder: 'e.g. LTO-2026-001234',
            helpText: '',
            span: 8,
            validation: { maxLength: 100 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
        ],
        minRows: 0,
        maxRows: 20,
      }),
    ],
  },
  {
    category: 'Oath of Undertaking',
    source: 'BPLO',
    notes: 'The applicant must certify that all information provided is true and correct.',
    items: [
      item('I hereby certify that all information stated above is true and correct to the best of my knowledge and belief. I further understand that any falsification or misrepresentation of information shall be a ground for denial or revocation of the business permit and may subject me to criminal prosecution under applicable laws.', 'checkbox', {
        key: 'oathOfUndertaking',
        required: true,
        helpText: 'You must agree to the oath of undertaking to proceed with the application.',
        placeholder: 'I agree to the oath of undertaking',
      }),
    ],
  },
]

// ─── General Permit Form (CBPLO-GPI-F06) ──────────────────────────
// For cooperatives, associations, firecracker stall holders, bazaar/festival vendors,
// peddlers, promotions/exhibitors, cemetery stallholders, fish trap/pen, fish pond, etc.
// Applicant details come from PIS (account registration); no separate section here.
const generalPermitSections = [
  {
    category: 'General Permit Details',
    source: 'BPLO',
    notes: 'Type and details of the general permit being applied for',
    items: [
      item('General permit category', 'select', {
        key: 'generalPermitCategory',
        helpText: 'Select the type of general permit',
        placeholder: 'Select category',
        dropdownOptions: [
          'cooperative',
          'association_foundation',
          'chainsaw',
          'firecrackers_stallholders',
          'bazaar_festival_vendors',
          'peddlers',
          'promotions_exhibitors',
          'cemetery_stallholders',
          'fish_trap_fish_pen',
          'fish_pond',
        ],
      }),
      item('Business / activity name', 'text', {
        key: 'activityName',
        placeholder: 'Enter name of business or activity',
        validation: { minLength: 2, maxLength: 200 },
      }),
      item('Location of activity', 'address', {
        key: 'activityLocation',
        helpText: 'Where the business activity or stall will be located',
      }),
      item('Duration of activity', 'text', {
        key: 'activityDuration',
        required: false,
        placeholder: 'e.g. December 15–31, 2026',
        helpText: 'For temporary permits (bazaar, festival, etc.), specify the dates',
        validation: { maxLength: 200 },
      }),
      item('Brief description of activity', 'textarea', {
        key: 'activityDescription',
        required: false,
        placeholder: 'Describe the products or services...',
        validation: { maxLength: 1000 },
      }),
    ],
  },
  // ─── Category-specific requirements (CBPLO-GPI-F06 per Alaminos requirements) ───
  {
    category: 'Requirements – Cooperative (New/Renewal)',
    source: 'BPLO',
    notes: 'Before processing: PIS, CTC, Barangay Clearance, CDA Registration (new), Certificate of Compliance from City Cooperatives Office, SPA/Authorization, Lease + Mayor\'s Permit of Lessor (if lessee). During: Application Form, Receipt of Payment.',
    showWhen: { field: 'generalPermitCategory', value: 'cooperative' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Cooperative Development Authority Registration (for NEW)', 'file', { key: 'cdaRegistration', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Certificate of Compliance from City Cooperatives Office', 'file', { key: 'cityCooperativesCompliance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('SPA or Authorization letter of Representative', 'file', { key: 'spaOrAuthLetter', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Contract of Lease and xerox copy of Mayor\'s Permit of Lessor (if lessee)', 'file', { key: 'leaseAndLessorPermit', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Association/Foundation (New/Renewal)',
    source: 'BPLO',
    notes: 'Before: PIS, CTC, Barangay Clearance, SEC/DOLE Registration, SPA/Authorization. During: Application Form, Receipt of Payment, Real Property Tax Clearance, Account Clearance (renewal).',
    showWhen: { field: 'generalPermitCategory', value: 'association_foundation' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('SEC / DOLE Registration', 'file', { key: 'secDoleRegistration', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('SPA or Authorization letter of Representative', 'file', { key: 'spaOrAuthLetter', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Real Property Tax Clearance', 'file', { key: 'rptClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Account Clearance (for Renewal)', 'file', { key: 'accountClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Chainsaw Permit (New/Renewal)',
    source: 'BPLO',
    notes: 'Before: PIS, CTC, Barangay Clearance, Certification of Chainsaw Ownership, Stencil of Chainsaw Serial No. During: Application Form, Receipt of Payment, RPT Clearance, Account Clearance (renewal).',
    showWhen: { field: 'generalPermitCategory', value: 'chainsaw' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Certification of Chainsaw Ownership', 'file', { key: 'chainsawOwnershipCert', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Stencil of Chainsaw Serial No.', 'file', { key: 'chainsawStencil', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Real Property Tax Clearance', 'file', { key: 'rptClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Account Clearance (for Renewal)', 'file', { key: 'accountClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Firecrackers Stallholders',
    source: 'BPLO',
    notes: 'Before: PIS, CTC, Barangay Clearance, Letter of Approval (City Market and Cemetery Section) with assessment, Dealers/Manufacturer\'s License from Camp Crame, Authorization/Certification of Dealers, Fireworks Retailers Seminar Certificate. During: Application Form, Receipt of Payment, Fire Safety Inspection Certificate (BFP).',
    showWhen: { field: 'generalPermitCategory', value: 'firecrackers_stallholders' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Letter of Approval by City Market and Cemetery Section Head with assessment of fees', 'file', { key: 'marketCemeteryApproval', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Authenticated photocopy of Dealers/Manufacturer\'s License of Source from Camp Crame', 'file', { key: 'campCrameLicense', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Authorization/Certification of Dealers/Licensee of Source', 'file', { key: 'dealerAuthorization', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Fireworks Retailers Seminar Certificate', 'file', { key: 'fireworksSeminarCert', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Fire Safety Inspection Certificate from BFP', 'file', { key: 'bfpFireSafetyCert', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Bazaar / Festival Vendors / Peddlers',
    source: 'BPLO',
    notes: 'PIS, CTC, Barangay Clearance, Certification from City Tourism Office (Lucap Wharf only), Letter of Approval by City Market and Cemetery Section Head with assessment of fees, Application Form, Receipt of Payment.',
    showWhen: { field: 'generalPermitCategory', values: ['bazaar_festival_vendors', 'peddlers'] },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Certification from City Tourism Office (Lucap Wharf only)', 'file', { key: 'tourismCert', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Letter of Approval by City Market and Cemetery Section Head with assessment of fees', 'file', { key: 'marketCemeteryApproval', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Promotions & Exhibitors',
    source: 'BPLO',
    notes: 'PIS of requesting party, Request letter approved by City Administrator, Letter of Approval by City Market and Cemetery Section Head with assessment of fees.',
    showWhen: { field: 'generalPermitCategory', value: 'promotions_exhibitors' },
    items: [
      item('Request letter approved by City Administrator', 'file', { key: 'requestLetterApproved', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Letter of Approval by City Market and Cemetery Section Head with assessment of fees', 'file', { key: 'marketCemeteryApproval', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Cemetery Stallholders',
    source: 'BPLO',
    notes: 'PIS, CTC, Barangay Clearance, Letter of Approval (City Market and Cemetery Section) with assessment, Application Form, Receipt of Payment.',
    showWhen: { field: 'generalPermitCategory', value: 'cemetery_stallholders' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Letter of Approval by City Market and Cemetery Section Head with assessment of fees', 'file', { key: 'marketCemeteryApproval', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Fish Trap / Fish Pen (New/Renewal)',
    source: 'BPLO',
    notes: 'Before: PIS, CTC, Barangay Clearance, Certification from Brgy. Captain & CFARMC Chairman, Certification from City Agriculturist, Contract of Lease (NEW), Assessment of fees. During: Application Form, Receipt of Payment, RPT Clearance, Account Clearance (renewal).',
    showWhen: { field: 'generalPermitCategory', value: 'fish_trap_fish_pen' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Certification from the Brgy. Captain & duly noted by CFARMC Chairman', 'file', { key: 'brgyCfarmcCert', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Certification from City Agriculturist (City Agriculture Office)', 'file', { key: 'cityAgriculturistCert', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Contract of Lease (NEW) from City Agriculture Office', 'file', { key: 'leaseContract', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Assessment of fees (City Agriculture Office)', 'file', { key: 'assessmentOfFees', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Real Property Tax Clearance', 'file', { key: 'rptClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Account Clearance (for Renewal)', 'file', { key: 'accountClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
  {
    category: 'Requirements – Fish Pond (New/Renewal)',
    source: 'BPLO',
    notes: 'Before: PIS, CTC, Barangay Clearance, Tax Declaration of property (photocopy), Assessment of fees. During: Application Form, Receipt of Payment, RPT Clearance, Account Clearance (renewal).',
    showWhen: { field: 'generalPermitCategory', value: 'fish_pond' },
    items: [
      item('Community Tax Certificate (CTC)', 'file', { key: 'ctc', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Barangay Clearance where business is located', 'file', { key: 'barangayClearance', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Tax Declaration of property (Photocopy)', 'file', { key: 'taxDeclaration', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Assessment of fees (City Agriculture Office)', 'file', { key: 'assessmentOfFees', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Real Property Tax Clearance', 'file', { key: 'rptClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
      item('Account Clearance (for Renewal)', 'file', { key: 'accountClearance', required: false, validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 } }),
    ],
  },
]

// ─── Mayor's Permit For Occupation Application Form (CBPLO-OPR-F013 Rev. 01) ───
// City Business Permit and Licensing Office – occupational permit (e.g. food handlers, non-food handlers).
// Personal info, occupational permit data, educational background, and required documents.
const occupationalPermitSections = [
  {
    category: 'Personal Information',
    source: 'BPLO',
    notes: 'Applicant personal data for the Mayor\'s Permit for Occupation application',
    items: [
      item('PIN (Personal Identification Number)', 'text', {
        key: 'pin',
        placeholder: 'e.g. 123456789',
        helpText: 'Personal identification number',
        validation: { maxLength: 30 },
        span: 12,
      }),
      item('Last Name', 'text', {
        key: 'lastName',
        placeholder: 'Last name',
        validation: { minLength: 1, maxLength: 100 },
        span: 8,
      }),
      item('First Name', 'text', {
        key: 'firstName',
        placeholder: 'First name',
        validation: { minLength: 1, maxLength: 100 },
        span: 8,
      }),
      item('Middle Name', 'text', {
        key: 'middleName',
        required: false,
        placeholder: 'Middle name',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Address', 'text', {
        key: 'address',
        placeholder: 'Full address',
        validation: { minLength: 1, maxLength: 300 },
      }),
      item('Place of Birth', 'text', {
        key: 'placeOfBirth',
        placeholder: 'City/Municipality, Province',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Highest Educational Attainment', 'text', {
        key: 'highestEducationalAttainment',
        placeholder: 'e.g. College Graduate, High School',
        validation: { maxLength: 100 },
        span: 12,
      }),
      item('Distinctive Mark', 'text', {
        key: 'distinctiveMark',
        required: false,
        placeholder: 'Visible identifying mark if any',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Spouse Name', 'text', {
        key: 'spouseName',
        required: false,
        placeholder: 'Full name of spouse',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Father Name', 'text', {
        key: 'fatherName',
        required: false,
        placeholder: 'Full name of father',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Mother Name', 'text', {
        key: 'motherName',
        required: false,
        placeholder: 'Full name of mother',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Gender', 'select', {
        key: 'gender',
        placeholder: 'Select gender',
        dropdownOptions: ['Male', 'Female'],
        span: 12,
      }),
      item('Civil Status', 'select', {
        key: 'civilStatus',
        placeholder: 'Select civil status',
        dropdownOptions: ['Single', 'Widower/Widow', 'Married', 'Separated'],
        span: 12,
      }),
      item('Date of Birth', 'date', {
        key: 'dateOfBirth',
        helpText: 'Format: mm/dd/yyyy',
        span: 12,
      }),
    ],
  },
  {
    category: 'Occupational Permit Data',
    source: 'BPLO',
    notes: 'Permanent and present address, employer, and employment details',
    items: [
      item('Permanent Address – Street', 'text', {
        key: 'permanentAddressStreet',
        placeholder: 'Street',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Permanent Address – Barangay', 'text', {
        key: 'permanentAddressBrgy',
        placeholder: 'Barangay',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Permanent Address – Municipality/City', 'text', {
        key: 'permanentAddressCity',
        placeholder: 'Municipality/City',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Permanent Address – Province', 'text', {
        key: 'permanentAddressProvince',
        placeholder: 'Province',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Present Address – Street', 'text', {
        key: 'presentAddressStreet',
        placeholder: 'Street',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Present Address – Barangay', 'text', {
        key: 'presentAddressBrgy',
        placeholder: 'Barangay',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Present Address – Municipality/City', 'text', {
        key: 'presentAddressCity',
        placeholder: 'Municipality/City',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Present Address – Province', 'text', {
        key: 'presentAddressProvince',
        placeholder: 'Province',
        validation: { maxLength: 100 },
        span: 8,
      }),
      item('Business Plate No.', 'text', {
        key: 'businessPlateNo',
        required: false,
        placeholder: 'If applicable',
        validation: { maxLength: 50 },
        span: 12,
      }),
      item('Name of Employer', 'text', {
        key: 'nameOfEmployer',
        required: false,
        placeholder: 'Full name of employer',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Company', 'text', {
        key: 'company',
        placeholder: 'Name of company or establishment',
        validation: { maxLength: 200 },
        span: 12,
      }),
      item('Company Address', 'text', {
        key: 'companyAddress',
        placeholder: 'Full address of company',
        validation: { maxLength: 300 },
        span: 12,
      }),
      item('Position', 'text', {
        key: 'position',
        placeholder: 'Job title or position',
        validation: { maxLength: 100 },
        span: 12,
      }),
      item('Type of Employment', 'select', {
        key: 'typeOfEmployment',
        placeholder: 'Select type',
        dropdownOptions: ['Self Employed', 'Employed'],
        span: 12,
      }),
      item('Contact No.', 'text', {
        key: 'contactNo',
        placeholder: 'e.g. 09171234567',
        validation: { maxLength: 20 },
        span: 12,
      }),
    ],
  },
  {
    category: 'Educational Background',
    source: 'BPLO',
    notes: 'Name of school, inclusive dates, and degree/course/strand per level',
    items: [
      item('Educational background', 'repeatable_group', {
        key: 'educationalBackground',
        helpText: 'Add one row per level: Elementary, Secondary, Vocational, College, Post Graduate',
        groupFields: [
          {
            label: 'Level',
            type: 'select',
            key: 'level',
            required: true,
            placeholder: 'Select level',
            span: 6,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: ['Elementary', 'Secondary', 'Vocational', 'College', 'Post Graduate'],
          },
          {
            label: 'Name of School',
            type: 'text',
            key: 'nameOfSchool',
            required: false,
            placeholder: 'Name of school',
            span: 6,
            validation: { maxLength: 200 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'Inclusive Dates – From',
            type: 'date',
            key: 'dateFrom',
            required: false,
            placeholder: 'From',
            span: 6,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'Inclusive Dates – To',
            type: 'date',
            key: 'dateTo',
            required: false,
            placeholder: 'To',
            span: 6,
            validation: {},
            dropdownSource: 'static',
            dropdownOptions: [],
          },
          {
            label: 'Degree / Course / Strand',
            type: 'text',
            key: 'degreeCourseStrand',
            required: false,
            placeholder: 'For Vocational, College, Post Graduate',
            span: 12,
            validation: { maxLength: 200 },
            dropdownSource: 'static',
            dropdownOptions: [],
          },
        ],
        minRows: 0,
        maxRows: 10,
      }),
    ],
  },
  {
    category: 'Application Details',
    source: 'BPLO',
    notes: 'Date of application and applicant signature',
    items: [
      item('Date of Application', 'date', {
        key: 'dateOfApplication',
        span: 12,
      }),
      item('Applicant\'s Signature', 'file', {
        key: 'applicantSignature',
        helpText: 'Upload signed form or signature image',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
        span: 12,
      }),
    ],
  },
  {
    category: 'Occupation Type',
    source: 'BPLO',
    notes: 'Select whether applicant is a food handler or non-food handler; this determines which laboratory exams are required.',
    items: [
      item('Occupation type', 'select', {
        key: 'occupationType',
        helpText: 'Food handler: lab exams include Urinalysis, Fecalysis, Hepa B, Chest X-Ray. Non-food handler: Drug Test, Chest X-Ray.',
        placeholder: 'Select type',
        dropdownOptions: ['Food Handler', 'Non-Food Handler'],
      }),
    ],
  },
  {
    category: 'Required Documents',
    source: 'BPLO',
    notes: 'Barangay Clearance, Community Tax Certificate, PIS Registration at MIS Office',
    items: [
      item('Barangay Clearance', 'file', {
        key: 'barangayClearance',
        helpText: 'From barangay where applicant resides',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Community Tax Certificate (CTC / Cedula)', 'file', {
        key: 'communityTaxCertificate',
        helpText: 'Current year CTC from City/Municipal Treasurer',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('PIS Registration at MIS Office', 'file', {
        key: 'pisRegistration',
        helpText: 'Proof of PIS registration at MIS Office',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
  {
    category: 'Laboratory Examinations – Food Handler',
    source: 'BPLO',
    notes: 'Required for food handlers: Urinalysis, Fecalysis, Hepa B Screening Test, Chest X-Ray',
    showWhen: { field: 'occupationType', value: 'Food Handler' },
    items: [
      item('Urinalysis', 'file', {
        key: 'labUrinalysis',
        helpText: 'Laboratory result for urinalysis',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Fecalysis', 'file', {
        key: 'labFecalysis',
        helpText: 'Laboratory result for fecalysis',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Hepa B Screening Test', 'file', {
        key: 'labHepaB',
        helpText: 'Hepatitis B screening result',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Chest X-Ray', 'file', {
        key: 'labChestXRay',
        helpText: 'Chest X-Ray result',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
    ],
  },
  {
    category: 'Laboratory Examinations – Non Food Handler',
    source: 'BPLO',
    notes: 'Required for non-food handlers: Drug Test, Chest X-Ray',
    showWhen: { field: 'occupationType', value: 'Non-Food Handler' },
    items: [
      item('Drug Test', 'file', {
        key: 'labDrugTest',
        helpText: 'Drug test result from accredited laboratory',
        validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 },
      }),
      item('Chest X-Ray', 'file', {
        key: 'labChestXRayNonFood',
        helpText: 'Chest X-Ray result',
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
async function createFormGroupAndDefinition({ formType, industryScope, sections, version = '2026.1', now, addArchivedVersion = false }) {
  const scopeLabel = industryScope === 'all' ? 'All Industries' : (INDUSTRY_SCOPE_LABELS[industryScope] || industryScope)
  const typeLabels = {
    permit: 'Unified Business Permit',
    general_permit: 'General Permit',
    occupation: "Mayor's Permit for Occupation",
    renewal: 'Business Renewal',
    cessation: 'Cessation',
    violation: 'Violation',
    appeal: 'Appeal',
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

  if (addArchivedVersion) {
    const archivedFrom = new Date(now)
    archivedFrom.setFullYear(archivedFrom.getFullYear() - 2)
    const archivedTo = new Date(now)
    archivedTo.setMonth(archivedTo.getMonth() - 6)
    await FormDefinition.create({
      formGroupId: group._id,
      formType,
      version: '2025.1',
      industryScope,
      name: displayName,
      description: `Philippine government ${typeLabels[formType] || formType} requirements for ${scopeLabel} (archived).`,
      status: 'archived',
      businessTypes,
      lguCodes: [],
      sections,
      downloads: [],
      effectiveFrom: archivedFrom,
      effectiveTo: archivedTo,
      publishedAt: archivedTo,
      publishedBy: SYSTEM_USER_ID,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      changeLog: [
        { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: archivedFrom, changes: { note: 'Seeded legacy version' } },
        { action: 'archived', by: SYSTEM_USER_ID, system: 'Seeder', at: archivedTo, changes: { note: 'Superseded by current version' } },
      ],
    })
  }

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

    // === Unified Business Permit (the main BPLO form) ===
    await createFormGroupAndDefinition({
      formType: 'permit',
      industryScope: 'all',
      sections: unifiedBusinessPermitSections,
      now,
      addArchivedVersion: true,
    })
    console.log('  Created: Unified Business Permit - All Industries')
    count++

    // === General Permit (CBPLO-GPI-F06) ===
    await createFormGroupAndDefinition({
      formType: 'general_permit',
      industryScope: 'all',
      sections: generalPermitSections,
      now,
    })
    console.log('  Created: General Permit - All Industries')
    count++

    // === Mayor's Permit for Occupation (CBPLO-OPR-F013 Rev. 01) ===
    await createFormGroupAndDefinition({
      formType: 'occupation',
      industryScope: 'all',
      sections: occupationalPermitSections,
      now,
    })
    console.log("  Created: Mayor's Permit for Occupation - All Industries")
    count++

    // === Global Renewal ===
    await createFormGroupAndDefinition({
      formType: 'renewal',
      industryScope: 'all',
      sections: globalRenewalSections,
      now,
      addArchivedVersion: true,
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

    // Unified Business Permit (with archived old version)
    await createFormGroupAndDefinition({ formType: 'permit', industryScope: 'all', sections: unifiedBusinessPermitSections, now, addArchivedVersion: true })
    count++

    // General Permit (CBPLO-GPI-F06)
    await createFormGroupAndDefinition({ formType: 'general_permit', industryScope: 'all', sections: generalPermitSections, now })
    count++

    // Mayor's Permit for Occupation (CBPLO-OPR-F013 Rev. 01)
    await createFormGroupAndDefinition({ formType: 'occupation', industryScope: 'all', sections: occupationalPermitSections, now })
    count++

    // Global renewal (with archived old version)
    await createFormGroupAndDefinition({ formType: 'renewal', industryScope: 'all', sections: globalRenewalSections, now, addArchivedVersion: true })
    count++

    // Global cessation
    await createFormGroupAndDefinition({ formType: 'cessation', industryScope: 'all', sections: globalCessationSections, now })
    count++

    // Global appeal, violation
    await createFormGroupAndDefinition({ formType: 'appeal', industryScope: 'all', sections: globalAppealSections, now })
    count++
    await createFormGroupAndDefinition({ formType: 'violation', industryScope: 'all', sections: globalViolationSections, now })
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
  unifiedBusinessPermitSections,
  generalPermitSections,
  occupationalPermitSections,
  globalRenewalSections,
  globalCessationSections,
  globalAppealSections,
  globalViolationSections,
  industrySections,
}
