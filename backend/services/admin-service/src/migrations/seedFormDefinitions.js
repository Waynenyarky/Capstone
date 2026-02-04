/**
 * Seed Form Definitions Migration
 * 
 * This script seeds the FormDefinition collection with initial data
 * from the hardcoded requirements in the frontend.
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

// Import the FormDefinition and FormGroup models
const FormDefinition = require('../models/FormDefinition')
const FormGroup = require('../models/FormGroup')

// System user ObjectId for seed data (a fixed ID representing "system")
// This allows us to satisfy the required createdBy/updatedBy fields
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001')

// Define the requirements data (matching frontend requirementsByType.jsx)
const requirementsByType = {
  general: [
    {
      category: 'Local Government Unit (LGU)',
      source: 'City/Municipality Business Permits Office',
      items: [
        { label: 'Duly accomplished application form', required: true },
        { label: 'Two 2×2 ID photos', required: true },
        { label: 'Valid IDs of the business owner', required: true },
        { label: 'Barangay business clearance', required: true },
        { label: 'Occupancy permit (if applicable)', required: false, notes: 'Required for establishments with physical premises' },
        { label: 'Fire Safety Inspection Certificate', required: true },
        { label: 'Community Tax Certificate (CTC)', required: true },
        { label: 'Lease contract or land title (if applicable)', required: false, notes: 'Required if renting or own property' },
        { label: 'Other applicable national or sectoral requirements', required: false },
      ],
    },
    {
      category: 'Bureau of Internal Revenue (BIR)',
      source: 'BIR Revenue District Office',
      items: [
        { label: "Mayor's permit or proof of ongoing LGU application", required: true },
        { label: 'DTI / SEC / CDA registration', required: true },
        { label: 'Barangay clearance', required: true },
        { label: 'Valid government-issued ID of the business owner', required: true },
        { label: 'Lease contract or land title', required: true },
      ],
    },
    {
      category: 'Other Government Agencies (if applicable)',
      source: 'Various agencies',
      items: [
        { label: 'Social Security System (SSS) registration', required: false, notes: 'Required if business has employees' },
        { label: 'PhilHealth registration', required: false, notes: 'Required if business has employees' },
        { label: 'Pag-IBIG Fund registration', required: false, notes: 'Required if business has employees' },
      ],
    },
  ],
  food_beverages: [
    {
      category: 'Food and Beverage Requirements',
      source: 'DOH / FDA / City Health Office',
      items: [
        { label: 'Sanitary permit and health certificate', required: true },
        { label: 'Food safety training certificates (if required)', required: false, notes: 'Required for food handlers' },
        { label: 'FDA permit or license (if applicable)', required: false, notes: 'Required for processed food manufacturers' },
      ],
    },
  ],
  manufacturing_industrial: [
    {
      category: 'Manufacturing / Industrial Requirements',
      source: 'DENR / DOLE',
      items: [
        { label: 'DENR environmental compliance certificate (ECC) if required', required: false, notes: 'Required for certain industrial activities' },
        { label: 'Waste disposal agreement or proof of disposal service', required: true },
        { label: 'Safety compliance certificates (if applicable)', required: false },
      ],
    },
  ],
  transportation_automotive_logistics: [
    {
      category: 'Transportation / Logistics Requirements',
      source: 'LTFRB / LTO',
      items: [
        { label: 'LTFRB or relevant transport franchise (if applicable)', required: false, notes: 'Required for public transport services' },
        { label: 'Vehicle registration documents', required: true },
        { label: 'Driver credentials and certifications', required: true },
      ],
    },
  ],
  agriculture_fishery_forestry: [
    {
      category: 'Agriculture / Fishery / Forestry Requirements',
      source: 'DA / BFAR / DENR',
      items: [
        { label: 'Bureau of Fisheries and Aquatic Resources permit (if applicable)', required: false },
        { label: 'DA or related permits for regulated products', required: false },
      ],
    },
  ],
  construction_real_estate_housing: [
    {
      category: 'Construction / Real Estate / Housing Requirements',
      source: 'PCAB / LGU Engineering Office',
      items: [
        { label: 'PCAB license (if applicable)', required: false, notes: 'Required for contractors' },
        { label: 'Building and occupancy permits (if applicable)', required: false },
        { label: 'Engineers/architects licenses for regulated work', required: false },
      ],
    },
  ],
  financial_insurance_banking: [
    {
      category: 'Financial / Insurance / Banking Requirements',
      source: 'SEC / BSP / IC',
      items: [
        { label: 'SEC registration (if required)', required: false },
        { label: 'BSP/IC or relevant regulator approvals (if applicable)', required: false },
        { label: 'Compliance and risk disclosures', required: false },
      ],
    },
  ],
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

    // Check if seed data already exists
    const existingCount = await FormDefinition.countDocuments({
      version: { $regex: /^1\.0\.0-seed/ },
    })

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing seed form definitions. Skipping...`)
      console.log('To re-seed, delete existing seed definitions first.')
      await mongoose.disconnect()
      return
    }

    const now = new Date()
    const businessTypes = [
      'food_beverages',
      'manufacturing_industrial',
      'transportation_automotive_logistics',
      'agriculture_fishery_forestry',
      'construction_real_estate_housing',
      'financial_insurance_banking',
    ]

    // Create FormGroup + FormDefinition for global (all industries)
    const groupAll = await FormGroup.create({
      formType: 'registration',
      industryScope: 'all',
      displayName: 'Business Registration - All Industries',
    })
    await FormDefinition.create({
      formGroupId: groupAll._id,
      formType: 'registration',
      version: '1.0.0-seed',
      industryScope: 'all',
      name: 'Business Registration Requirements (General)',
      description: 'Initial seed data from hardcoded requirements. Applies to all business types.',
      status: 'published',
      businessTypes: [],
      lguCodes: [],
      sections: requirementsByType.general,
      downloads: [],
      effectiveFrom: now,
      effectiveTo: null,
      publishedAt: now,
      publishedBy: SYSTEM_USER_ID,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      changeLog: [
        { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Seeded from hardcoded requirements' } },
        { action: 'published', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Auto-published as seed data' } },
      ],
    })
    console.log('  Created: Business Registration - All Industries')

    // Create FormGroup + FormDefinition for each industry-specific
    for (const businessType of businessTypes) {
      const typeRequirements = requirementsByType[businessType]
      if (!typeRequirements || typeRequirements.length === 0) continue

      const combinedSections = [...requirementsByType.general, ...typeRequirements]
      const scopeLabel = formatBusinessType(businessType)

      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: businessType,
        displayName: `Business Registration - ${scopeLabel}`,
      })
      await FormDefinition.create({
        formGroupId: group._id,
        formType: 'registration',
        version: '1.0.0-seed',
        industryScope: businessType,
        name: `Business Registration Requirements (${scopeLabel})`,
        description: `Initial seed data with ${scopeLabel} specific requirements.`,
        status: 'published',
        businessTypes: [businessType],
        lguCodes: [],
        sections: combinedSections,
        downloads: [],
        effectiveFrom: now,
        effectiveTo: null,
        publishedAt: now,
        publishedBy: SYSTEM_USER_ID,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        changeLog: [
          { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Seeded from hardcoded requirements' } },
          { action: 'published', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Auto-published as seed data' } },
        ],
      })
      console.log(`  Created: Business Registration - ${scopeLabel}`)
    }

    const definitionsCount = 1 + businessTypes.filter((bt) => requirementsByType[bt]?.length).length

    console.log('Seed completed successfully!')
    console.log(`Total definitions created: ${definitionsCount}`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (error) {
    console.error('Seed failed:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

function formatBusinessType(value) {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
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
    const businessTypes = [
      'food_beverages',
      'manufacturing_industrial',
      'transportation_automotive_logistics',
      'agriculture_fishery_forestry',
      'construction_real_estate_housing',
      'financial_insurance_banking',
    ]

    // Create FormGroup + FormDefinition for global (all industries)
    const groupAll = await FormGroup.create({
      formType: 'registration',
      industryScope: 'all',
      displayName: 'Business Registration - All Industries',
    })
    await FormDefinition.create({
      formGroupId: groupAll._id,
      formType: 'registration',
      version: '1.0.0-seed',
      industryScope: 'all',
      name: 'Business Registration Requirements (General)',
      description: 'Initial seed data from hardcoded requirements. Applies to all business types.',
      status: 'published',
      businessTypes: [],
      lguCodes: [],
      sections: requirementsByType.general,
      downloads: [],
      effectiveFrom: now,
      effectiveTo: null,
      publishedAt: now,
      publishedBy: SYSTEM_USER_ID,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      changeLog: [
        { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Seeded from hardcoded requirements' } },
        { action: 'published', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Auto-published as seed data' } },
      ],
    })

    // Create FormGroup + FormDefinition for each industry-specific
    for (const businessType of businessTypes) {
      const typeRequirements = requirementsByType[businessType]
      if (!typeRequirements || typeRequirements.length === 0) continue

      const combinedSections = [...requirementsByType.general, ...typeRequirements]
      const scopeLabel = formatBusinessType(businessType)

      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: businessType,
        displayName: `Business Registration - ${scopeLabel}`,
      })
      await FormDefinition.create({
        formGroupId: group._id,
        formType: 'registration',
        version: '1.0.0-seed',
        industryScope: businessType,
        name: `Business Registration Requirements (${scopeLabel})`,
        description: `Initial seed data with ${scopeLabel} specific requirements.`,
        status: 'published',
        businessTypes: [businessType],
        lguCodes: [],
        sections: combinedSections,
        downloads: [],
        effectiveFrom: now,
        effectiveTo: null,
        publishedAt: now,
        publishedBy: SYSTEM_USER_ID,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        changeLog: [
          { action: 'created', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Seeded from hardcoded requirements' } },
          { action: 'published', by: SYSTEM_USER_ID, system: 'Seeder', at: now, changes: { note: 'Auto-published as seed data' } },
        ],
      })
    }

    const definitionsCount = 1 + businessTypes.filter((bt) => requirementsByType[bt]?.length).length
    console.log(`[FormDefinitions] Seeded ${definitionsCount} form definitions successfully.`)
    
    return { seeded: true, count: definitionsCount }
  } catch (error) {
    console.error('[FormDefinitions] Seed failed:', error.message)
    return { seeded: false, error: error.message }
  }
}

// Run if called directly
if (require.main === module) {
  seed()
}

module.exports = { seed, seedIfEmpty, requirementsByType, SYSTEM_USER_ID }
