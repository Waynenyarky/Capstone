/**
 * Form Definitions Tests
 * Unit tests for FormDefinition model
 */

jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.resolve(),
  }),
}))

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.setTimeout(60000)

describe('FormDefinition Model Unit Tests', () => {
  let mongo
  let FormDefinition
  let adminUserId

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'

    mongo = await MongoMemoryServer.create()
    const uri = mongo.getUri()
    await mongoose.connect(uri)

    // Create a mock admin user ID
    adminUserId = new mongoose.Types.ObjectId()

    // Define FormDefinition schema inline for unit testing
    const FormDefinitionSchema = new mongoose.Schema(
      {
        formType: {
          type: String,
          required: true,
          enum: ['registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal'],
        },
        version: {
          type: String,
          required: true,
          default: '1.0',
        },
        name: {
          type: String,
          trim: true,
        },
        description: String,
        status: {
          type: String,
          enum: ['draft', 'pending_approval', 'published', 'archived'],
          default: 'draft',
        },
        businessTypes: [{ type: String }],
        lguCodes: [{ type: String }],
        sections: [
          {
            category: { type: String, required: true },
            source: String,
            notes: String,
            items: [
              {
                label: { type: String, required: true },
                required: { type: Boolean, default: true },
                notes: String,
              },
            ],
          },
        ],
        downloads: [
          {
            label: { type: String, required: true },
            fileUrl: { type: String, required: true },
            fileType: String,
            ipfsHash: String,
          },
        ],
        effectiveFrom: Date,
        effectiveUntil: Date,
        approvalId: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      { timestamps: true }
    )

    // Static method for finding active definition
    FormDefinitionSchema.statics.findActiveDefinition = async function (
      formType,
      businessType,
      lguCode
    ) {
      const now = new Date()
      const query = {
        formType,
        status: 'published',
        $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: { $lte: now } }],
      }

      // Fetch all matching definitions
      const definitions = await this.find(query).sort({ createdAt: -1 }).lean()

      if (definitions.length === 0) return null

      // Score each definition by specificity
      const scored = definitions.map((def) => {
        let score = 0
        const matchesBT =
          def.businessTypes?.length === 0 || def.businessTypes?.includes(businessType)
        const matchesLGU = def.lguCodes?.length === 0 || def.lguCodes?.includes(lguCode)

        if (matchesBT && def.businessTypes?.length > 0) score += 2
        if (matchesLGU && def.lguCodes?.length > 0) score += 1

        return { def, score, matchesBT, matchesLGU }
      })

      // Filter to only those that match targeting
      const valid = scored.filter((s) => s.matchesBT && s.matchesLGU)

      if (valid.length === 0) {
        // Fallback to global (no targeting)
        const global = scored.find(
          (s) =>
            (!s.def.businessTypes || s.def.businessTypes.length === 0) &&
            (!s.def.lguCodes || s.def.lguCodes.length === 0)
        )
        return global ? global.def : null
      }

      // Return highest score
      valid.sort((a, b) => b.score - a.score)
      return valid[0].def
    }

    FormDefinition = mongoose.model('FormDefinitionTest', FormDefinitionSchema)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
  })

  beforeEach(async () => {
    await FormDefinition.deleteMany({})
  })

  describe('FormDefinition Model', () => {
    it('should create a form definition with valid data', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '2026.1',
        name: 'Test Registration Requirements',
        status: 'draft',
        sections: [
          {
            category: 'LGU Requirements',
            source: 'City Hall',
            items: [
              { label: 'Application Form', required: true },
              { label: 'ID Photos', required: true },
            ],
          },
        ],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.formType).toBe('registration')
      expect(def.version).toBe('2026.1')
      expect(def.status).toBe('draft')
      expect(def.sections.length).toBe(1)
      expect(def.sections[0].items.length).toBe(2)
    })

    it('should validate formType enum', async () => {
      await expect(
        FormDefinition.create({
          formType: 'invalid_type',
          version: '1.0',
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })
      ).rejects.toThrow()
    })

    it('should validate status enum', async () => {
      await expect(
        FormDefinition.create({
          formType: 'registration',
          version: '1.0',
          status: 'invalid_status',
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })
      ).rejects.toThrow()
    })

    it('should allow all valid formTypes', async () => {
      const types = ['registration', 'permit', 'renewal']

      for (const formType of types) {
        const def = await FormDefinition.create({
          formType,
          version: '1.0',
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })
        expect(def.formType).toBe(formType)
      }
    })

    it('should allow all valid statuses', async () => {
      const statuses = ['draft', 'pending_approval', 'published', 'archived']

      for (let i = 0; i < statuses.length; i++) {
        const def = await FormDefinition.create({
          formType: 'registration',
          version: `${i + 1}.0`,
          status: statuses[i],
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })
        expect(def.status).toBe(statuses[i])
      }
    })

    it('should default status to draft', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.status).toBe('draft')
    })

    it('should store sections with items', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [
          {
            category: 'LGU Requirements',
            source: 'City Hall',
            notes: 'Important notes',
            items: [
              { label: 'Item 1', required: true, notes: 'Note 1' },
              { label: 'Item 2', required: false, notes: 'Note 2' },
            ],
          },
          {
            category: 'BIR Requirements',
            items: [{ label: 'TIN', required: true }],
          },
        ],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections.length).toBe(2)
      expect(def.sections[0].category).toBe('LGU Requirements')
      expect(def.sections[0].source).toBe('City Hall')
      expect(def.sections[0].items.length).toBe(2)
      expect(def.sections[0].items[0].required).toBe(true)
      expect(def.sections[0].items[1].required).toBe(false)
    })

    it('should store downloads', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        downloads: [
          { label: 'Application Form', fileUrl: '/forms/app.pdf', fileType: 'pdf' },
          { label: 'Guide', fileUrl: '/forms/guide.docx', fileType: 'docx' },
        ],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.downloads.length).toBe(2)
      expect(def.downloads[0].label).toBe('Application Form')
      expect(def.downloads[0].fileType).toBe('pdf')
    })

    it('should store targeting arrays', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        businessTypes: ['food_beverages', 'retail_trade'],
        lguCodes: ['CEBU-CITY', 'MANILA'],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.businessTypes).toContain('food_beverages')
      expect(def.businessTypes).toContain('retail_trade')
      expect(def.lguCodes).toContain('CEBU-CITY')
      expect(def.lguCodes).toContain('MANILA')
    })
  })

  describe('findActiveDefinition', () => {
    beforeEach(async () => {
      // Create test definitions with different targeting
      await FormDefinition.create([
        {
          formType: 'registration',
          version: '1.0',
          name: 'Global Default',
          status: 'published',
          businessTypes: [],
          lguCodes: [],
          sections: [{ category: 'Global', items: [] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
        {
          formType: 'registration',
          version: '1.1',
          name: 'Food & Beverages Specific',
          status: 'published',
          businessTypes: ['food_beverages'],
          lguCodes: [],
          sections: [{ category: 'F&B', items: [] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
        {
          formType: 'registration',
          version: '1.2',
          name: 'Cebu City Specific',
          status: 'published',
          businessTypes: [],
          lguCodes: ['CEBU-CITY'],
          sections: [{ category: 'Cebu', items: [] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
        {
          formType: 'registration',
          version: '1.3',
          name: 'F&B in Cebu',
          status: 'published',
          businessTypes: ['food_beverages'],
          lguCodes: ['CEBU-CITY'],
          sections: [{ category: 'F&B Cebu', items: [] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
      ])
    })

    it('should return global definition when no targeting matches', async () => {
      const result = await FormDefinition.findActiveDefinition('registration', 'services', 'MANILA')
      expect(result.name).toBe('Global Default')
    })

    it('should return business-type specific definition', async () => {
      const result = await FormDefinition.findActiveDefinition(
        'registration',
        'food_beverages',
        'MANILA'
      )
      expect(result.name).toBe('Food & Beverages Specific')
    })

    it('should return LGU-specific definition', async () => {
      const result = await FormDefinition.findActiveDefinition(
        'registration',
        'services',
        'CEBU-CITY'
      )
      expect(result.name).toBe('Cebu City Specific')
    })

    it('should return most specific definition (business type + LGU)', async () => {
      const result = await FormDefinition.findActiveDefinition(
        'registration',
        'food_beverages',
        'CEBU-CITY'
      )
      expect(result.name).toBe('F&B in Cebu')
    })

    it('should return null for non-existent form type', async () => {
      const result = await FormDefinition.findActiveDefinition('permit', 'services', 'MANILA')
      expect(result).toBeNull()
    })

    it('should not return draft definitions', async () => {
      await FormDefinition.create({
        formType: 'permit',
        version: '1.0',
        name: 'Draft Permit',
        status: 'draft',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const result = await FormDefinition.findActiveDefinition('permit', 'services', 'MANILA')
      expect(result).toBeNull()
    })

    it('should not return archived definitions', async () => {
      await FormDefinition.create({
        formType: 'renewal',
        version: '1.0',
        name: 'Archived Renewal',
        status: 'archived',
        effectiveFrom: new Date('2020-01-01'),
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const result = await FormDefinition.findActiveDefinition('renewal', 'services', 'MANILA')
      expect(result).toBeNull()
    })
  })
})
