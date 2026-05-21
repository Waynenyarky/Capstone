/**
 * Seeder for initial Permit Forms section.
 *
 * The business_permits_sample folder contains PNG images of actual permit
 * requirements. Since extracting text from images at seed time requires OCR
 * dependencies that may not be available in all environments, this seeder
 * uses manually transcribed content from those images as initial data.
 *
 * Usage: node seedPermitForms.js
 */

const mongoose = require('mongoose')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: false })
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '..', '.env'), override: false })

const connectDB = require('../config/db')

// Helper: create a date N days ago from now
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const SAMPLE_CARDS = [
  {
    cardId: 'seed-business-permit',
    title: 'Business Permit (New Application)',
    description:
      'Required for all new business establishments within the municipality. Submit the completed form along with the listed requirements.',
    requirements: [
      'DTI/SEC/CDA Registration Certificate',
      'Barangay Business Clearance',
      'Community Tax Certificate (Cedula)',
      'Contract of Lease / Land Title (if applicable)',
      'Fire Safety Inspection Certificate',
      'Sanitary Permit',
      'Environmental Compliance Certificate (if applicable)',
      'Location Map / Sketch',
      '2x2 ID Photo of Owner (2 copies)',
    ],
    processingSteps: [
      { stepId: 'bp-new-1', title: 'Submit Application Online', description: 'Complete the online application form, upload all required documents, and submit for initial processing.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'bp-new-2', title: 'Document Completeness Check', description: 'BPLO staff reviews uploaded documents and verifies that all requirements are present and legible.', estimatedDurationDays: 1, order: 1 },
      { stepId: 'bp-new-3', title: 'Zoning Clearance Verification', description: 'System cross-references your business address with the municipal zoning map and land use plan.', estimatedDurationDays: 2, order: 2 },
      { stepId: 'bp-new-4', title: 'Fire Safety Inspection', description: 'Bureau of Fire Protection conducts on-site or desk inspection, depending on business category and floor area.', estimatedDurationDays: 4, order: 3 },
      { stepId: 'bp-new-5', title: 'Sanitary / Health Clearance', description: 'Municipal Health Office validates health certificates and sanitary conditions of the premises.', estimatedDurationDays: 2, order: 4 },
      { stepId: 'bp-new-6', title: 'Assessment & Fee Computation', description: 'BPLO computes applicable fees based on business type, capitalization, floor area, and number of employees.', estimatedDurationDays: 1, order: 5 },
      { stepId: 'bp-new-7', title: 'Payment Processing', description: 'Pay the assessed fees online or at the Municipal Treasurer\'s Office. A digital receipt is generated upon confirmation.', estimatedDurationDays: 1, order: 6 },
      { stepId: 'bp-new-8', title: 'Permit Issuance', description: 'Once payment is verified, your Business Permit is generated digitally and recorded on the blockchain for tamper-proof audit.', estimatedDurationDays: 1, order: 7 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Business_Permit_New_Application.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(3),
    order: 0,
  },
  {
    cardId: 'seed-business-renewal',
    title: 'Business Permit (Renewal)',
    description:
      'For annual renewal of existing business permits. Ensure all previous year requirements and clearances are current.',
    requirements: [
      'Previous year Business Permit (photocopy)',
      'Barangay Business Clearance (current year)',
      'Community Tax Certificate (Cedula)',
      'Updated DTI/SEC/CDA Registration',
      'Fire Safety Inspection Certificate (current year)',
      'Sanitary Permit (current year)',
      'Official Receipt of previous year permit fees',
    ],
    processingSteps: [
      { stepId: 'bp-ren-1', title: 'Submit Renewal Application', description: 'Log in to your account, select your existing business, and submit the renewal application with updated documents.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'bp-ren-2', title: 'Previous Permit Validation', description: 'System verifies your previous permit record and checks for outstanding violations or unpaid balances.', estimatedDurationDays: 1, order: 1 },
      { stepId: 'bp-ren-3', title: 'Document Review', description: 'BPLO staff verifies that current-year clearances and updated registrations are complete and valid.', estimatedDurationDays: 2, order: 2 },
      { stepId: 'bp-ren-4', title: 'Clearance Cross-Check', description: 'Fire safety, sanitary, and zoning clearances are validated against agency records.', estimatedDurationDays: 2, order: 3 },
      { stepId: 'bp-ren-5', title: 'Fee Assessment', description: 'Renewal fees are computed based on gross sales/receipts declared for the previous year.', estimatedDurationDays: 1, order: 4 },
      { stepId: 'bp-ren-6', title: 'Payment Processing', description: 'Pay the assessed renewal fees. Late renewals may incur surcharges as per local ordinance.', estimatedDurationDays: 1, order: 5 },
      { stepId: 'bp-ren-7', title: 'Permit Renewal Issuance', description: 'Renewed Business Permit is issued digitally and the blockchain audit trail is updated.', estimatedDurationDays: 1, order: 6 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Business_Permit_Renewal.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(7),
    order: 1,
  },
  {
    cardId: 'seed-occupational-permit',
    title: 'Occupational Permit',
    description:
      'Required for individuals working within the municipality. Must be secured annually.',
    requirements: [
      'Community Tax Certificate (Cedula)',
      'Barangay Clearance',
      'Police Clearance',
      'Health Certificate / Medical Certificate',
      '1x1 ID Photo (2 copies)',
      'Certificate of Employment or Appointment',
    ],
    processingSteps: [
      { stepId: 'occ-1', title: 'Submit Application', description: 'Fill out the occupational permit form online and upload your personal clearances and employment certificate.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'occ-2', title: 'Identity & Clearance Verification', description: 'Staff validates your barangay clearance, police clearance, and community tax certificate.', estimatedDurationDays: 1, order: 1 },
      { stepId: 'occ-3', title: 'Health Certificate Review', description: 'Municipal Health Office confirms the validity of your medical or health certificate.', estimatedDurationDays: 1, order: 2 },
      { stepId: 'occ-4', title: 'Fee Payment', description: 'Pay the occupational permit fee online or at the treasurer\'s office.', estimatedDurationDays: 1, order: 3 },
      { stepId: 'occ-5', title: 'Permit Issuance', description: 'Your Occupational Permit is generated and made available for download in your account.', estimatedDurationDays: 1, order: 4 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Occupational_Permit.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(14),
    order: 2,
  },
  {
    cardId: 'seed-fire-safety',
    title: 'Fire Safety Inspection Certificate',
    description:
      'Issued by the Bureau of Fire Protection. Required for all business permit applications.',
    requirements: [
      'Accomplished FSIC Application Form',
      'Building Permit / Occupancy Permit',
      'Fire Insurance Policy',
      'Floor Plan / Building Plan',
      'Fire Safety Compliance Report',
    ],
    processingSteps: [
      { stepId: 'fsic-1', title: 'Submit FSIC Application', description: 'Upload the completed FSIC application form and supporting building/floor plans online.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'fsic-2', title: 'Document Pre-Screening', description: 'Bureau of Fire Protection reviews submitted documents for completeness before scheduling inspection.', estimatedDurationDays: 2, order: 1 },
      { stepId: 'fsic-3', title: 'On-Site Fire Safety Inspection', description: 'A fire safety inspector visits the premises to assess fire exits, extinguishers, alarms, and overall compliance.', estimatedDurationDays: 5, order: 2 },
      { stepId: 'fsic-4', title: 'Compliance Evaluation', description: 'Inspector files a report. If deficiencies are found, a corrective action notice is issued.', estimatedDurationDays: 2, order: 3 },
      { stepId: 'fsic-5', title: 'Fee Payment', description: 'Pay the FSIC inspection fee based on building floor area and occupancy type.', estimatedDurationDays: 1, order: 4 },
      { stepId: 'fsic-6', title: 'Certificate Issuance', description: 'Fire Safety Inspection Certificate is issued once all requirements and fees are cleared.', estimatedDurationDays: 1, order: 5 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Fire_Safety_Inspection.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(10),
    order: 3,
  },
  {
    cardId: 'seed-sanitary-permit',
    title: 'Sanitary Permit',
    description:
      'Required for businesses handling food, beverages, or health-related services.',
    requirements: [
      'Health Certificate of all employees',
      'Water Potability Test Result',
      'Sanitary inspection of premises',
      'Pest Control Certificate (if food establishment)',
      'Valid Business Permit or application proof',
    ],
    processingSteps: [
      { stepId: 'san-1', title: 'Submit Application', description: 'Upload the sanitary permit application along with employee health certificates and water test results.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'san-2', title: 'Document Review', description: 'Municipal Health Office reviews all submitted health and sanitation documents.', estimatedDurationDays: 2, order: 1 },
      { stepId: 'san-3', title: 'Sanitary Inspection', description: 'A sanitary inspector visits the establishment to check hygiene standards, waste disposal, and food handling practices.', estimatedDurationDays: 3, order: 2 },
      { stepId: 'san-4', title: 'Inspection Report & Compliance', description: 'Inspector submits findings. Non-compliant establishments receive corrective action requirements before approval.', estimatedDurationDays: 2, order: 3 },
      { stepId: 'san-5', title: 'Fee Payment & Issuance', description: 'Pay the sanitary permit fee and receive your Sanitary Permit upon clearance.', estimatedDurationDays: 1, order: 4 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Sanitary_Permit.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(18),
    order: 4,
  },
  {
    cardId: 'seed-building-permit',
    title: 'Building Permit',
    description:
      'Required before construction, renovation, or demolition of any structure.',
    requirements: [
      'Architectural Plans (signed by licensed architect)',
      'Structural Plans (signed by licensed civil engineer)',
      'Electrical Plans',
      'Plumbing / Sanitary Plans',
      'Land Title / Tax Declaration',
      'Lot Plan with vicinity map',
      'Barangay Clearance',
      'Locational Clearance / Zoning Certificate',
    ],
    processingSteps: [
      { stepId: 'bld-1', title: 'Submit Building Permit Application', description: 'Upload architectural, structural, electrical, and plumbing plans along with land ownership documents.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'bld-2', title: 'Plan Review by Municipal Engineer', description: 'The Municipal Engineering Office reviews all submitted plans for structural integrity and code compliance.', estimatedDurationDays: 5, order: 1 },
      { stepId: 'bld-3', title: 'Zoning Compliance Check', description: 'Municipal Planning Office verifies that the proposed construction complies with the local zoning ordinance.', estimatedDurationDays: 3, order: 2 },
      { stepId: 'bld-4', title: 'Fire Safety Plan Review', description: 'Bureau of Fire Protection reviews fire safety provisions in the building plans.', estimatedDurationDays: 3, order: 3 },
      { stepId: 'bld-5', title: 'Environmental Clearance (if applicable)', description: 'For larger projects, an environmental compliance certificate from DENR may be required.', estimatedDurationDays: 5, order: 4 },
      { stepId: 'bld-6', title: 'Fee Computation & Payment', description: 'Building permit fees are computed based on project scope, floor area, and estimated cost.', estimatedDurationDays: 2, order: 5 },
      { stepId: 'bld-7', title: 'Building Permit Issuance', description: 'Building Permit is issued after all clearances and fees are settled. Valid for one year from issuance.', estimatedDurationDays: 1, order: 6 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Building_Permit.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(25),
    order: 5,
  },
  {
    cardId: 'seed-zoning-clearance',
    title: 'Zoning / Locational Clearance',
    description:
      'Certifies that the business location complies with local zoning regulations.',
    requirements: [
      'Accomplished Application Form',
      'Land Title / Tax Declaration',
      'Lot Plan / Vicinity Map',
      'Contract of Lease (if applicable)',
      'Barangay Clearance',
    ],
    processingSteps: [
      { stepId: 'zon-1', title: 'Submit Zoning Application', description: 'Upload the completed application form with land title, lot plan, and barangay clearance.', estimatedDurationDays: 0, order: 0 },
      { stepId: 'zon-2', title: 'Location Mapping & Verification', description: 'Municipal Planning Office plots your business address on the official zoning map.', estimatedDurationDays: 2, order: 1 },
      { stepId: 'zon-3', title: 'Land Use Compatibility Review', description: 'Staff checks whether the intended business activity is allowed under the zone classification of the location.', estimatedDurationDays: 2, order: 2 },
      { stepId: 'zon-4', title: 'Fee Payment', description: 'Pay the zoning clearance fee at the Municipal Treasurer\'s Office or online.', estimatedDurationDays: 1, order: 3 },
      { stepId: 'zon-5', title: 'Clearance Issuance', description: 'Zoning / Locational Clearance certificate is issued and made available for download.', estimatedDurationDays: 1, order: 4 },
    ],
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Zoning_Clearance.pdf', size: 13264 },
    lastUpdatedAt: daysAgo(5),
    order: 6,
  },
]

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI)
    const PermitFormsSection = require('../models/PermitFormsSection')

    const existing = await PermitFormsSection.findOne()
    if (existing) {
      console.log('PermitFormsSection already exists. Skipping seed.')
      return
    }

    await PermitFormsSection.create({
      sectionDescription:
        'Below are the permit forms and their requirements. Please download the applicable form, fill it out completely, and submit along with the listed requirements.',
      cards: SAMPLE_CARDS,
      publishedSectionDescription:
        'Below are the permit forms and their requirements. Please download the applicable form, fill it out completely, and submit along with the listed requirements.',
      publishedCards: SAMPLE_CARDS,
      isPublished: true,
      isEnabled: true,
      lastPublishedAt: new Date(),
    })

    console.log(`Seeded PermitFormsSection with ${SAMPLE_CARDS.length} cards (published).`)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

/**
 * Idempotent seed function for startup.
 * Seeds permit forms only when the collection is empty.
 * Returns result object for logging.
 */
async function seedPermitFormsIfEmpty() {
  const enabled = process.env.SEED_PERMIT_FORMS === 'true' || process.env.SEED_DEV === 'true';
  if (!enabled) {
    return { seeded: false, reason: 'SEED_PERMIT_FORMS or SEED_DEV not set' };
  }

  try {
    const PermitFormsSection = require('../models/PermitFormsSection');
    const existing = await PermitFormsSection.findOne();
    if (existing) {
      return { seeded: false, reason: 'already has permit forms section', count: SAMPLE_CARDS.length };
    }

    await PermitFormsSection.create({
      sectionDescription:
        'Below are the permit forms and their requirements. Please download the applicable form, fill it out completely, and submit along with the listed requirements.',
      cards: SAMPLE_CARDS,
      publishedSectionDescription:
        'Below are the permit forms and their requirements. Please download the applicable form, fill it out completely, and submit along with the listed requirements.',
      publishedCards: SAMPLE_CARDS,
      isPublished: true,
      isEnabled: true,
      lastPublishedAt: new Date(),
    });

    return { seeded: true, created: SAMPLE_CARDS.length };
  } catch (err) {
    return { seeded: false, error: err.message };
  }
}

if (require.main === module) {
  seed()
}

module.exports = { seed, seedPermitFormsIfEmpty, SAMPLE_CARDS }
