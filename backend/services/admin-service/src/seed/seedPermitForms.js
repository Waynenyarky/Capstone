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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Business_Permit_New_Application.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Business_Permit_Renewal.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Occupational_Permit.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Fire_Safety_Inspection.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Sanitary_Permit.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Building_Permit.pdf', size: 13264 },
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
    downloadableFile: { cid: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Zoning_Clearance.pdf', size: 13264 },
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
      publishedSectionDescription: '',
      publishedCards: [],
      isPublished: false,
      isEnabled: true,
    })

    console.log(`Seeded PermitFormsSection with ${SAMPLE_CARDS.length} cards.`)
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
      publishedSectionDescription: '',
      publishedCards: [],
      isPublished: false,
      isEnabled: true,
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
