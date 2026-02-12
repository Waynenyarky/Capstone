/**
 * Form Definitions Tests
 * Tests for FormDefinition model with expanded RequirementItemSchema,
 * all field types, CRUD operations, file upload, and deactivation.
 */

jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.resolve(),
  }),
}))

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.setTimeout(60000)

describe('FormDefinition Model Tests', () => {
  let mongo
  let FormDefinition
  let FormGroup
  let adminUserId

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'

    mongo = await MongoMemoryServer.create()
    const uri = mongo.getUri()
    await mongoose.connect(uri)

    adminUserId = new mongoose.Types.ObjectId()

    // ── Import actual models from admin-service ──
    FormDefinition = require('../../../services/admin-service/src/models/FormDefinition')
    FormGroup = require('../../../services/admin-service/src/models/FormGroup')
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
  })

  beforeEach(async () => {
    await FormDefinition.deleteMany({})
    await FormGroup.deleteMany({})
  })

  // ─── Schema basics ──────────────────────────────────────────────
  describe('Schema basics', () => {
    it('should create a form definition with valid data', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '2026.1',
        name: 'Test Registration Requirements',
        status: 'draft',
        sections: [
          {
            category: 'LGU Requirements',
            source: 'BPLO',
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

    it('should allow all valid formTypes including inspections', async () => {
      const types = ['registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal', 'inspections']

      for (const formType of types) {
        const def = await FormDefinition.create({
          formType,
          version: '1.0',
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })
        expect(def.formType).toBe(formType)
        await def.deleteOne()
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
  })

  // ─── Expanded RequirementItemSchema ─────────────────────────────
  describe('Expanded RequirementItemSchema', () => {
    it('should accept all valid field types', async () => {
      const fieldTypes = ['text', 'textarea', 'number', 'date', 'select', 'multiselect', 'file', 'download', 'checkbox', 'address']

      const items = fieldTypes.map((type) => ({
        label: `Test ${type} field`,
        type,
        required: true,
      }))

      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{ category: 'Test Section', items }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections[0].items.length).toBe(fieldTypes.length)
      fieldTypes.forEach((type, idx) => {
        expect(def.sections[0].items[idx].type).toBe(type)
      })
    })

    it('should default field type to file', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [{ label: 'No type specified', required: true }],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections[0].items[0].type).toBe('file')
    })

    it('should store placeholder and helpText', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [{
            label: 'Business name',
            type: 'text',
            placeholder: 'Enter business name',
            helpText: 'As registered with DTI/SEC/CDA',
            required: true,
          }],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const item = def.sections[0].items[0]
      expect(item.placeholder).toBe('Enter business name')
      expect(item.helpText).toBe('As registered with DTI/SEC/CDA')
    })

    it('should store span with default of 24', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [
            { label: 'Full width', type: 'text', required: true },
            { label: 'Half width', type: 'text', required: true, span: 12 },
            { label: 'Third width', type: 'text', required: true, span: 8 },
          ],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections[0].items[0].span).toBe(24) // default
      expect(def.sections[0].items[1].span).toBe(12)
      expect(def.sections[0].items[2].span).toBe(8)
    })

    it('should store validation rules as Mixed object', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [{
            label: 'Business name',
            type: 'text',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 200,
              pattern: '^[A-Za-z]',
            },
          }],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const v = def.sections[0].items[0].validation
      expect(v.minLength).toBe(2)
      expect(v.maxLength).toBe(200)
      expect(v.pattern).toBe('^[A-Za-z]')
    })

    it('should store dropdown configuration', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [{
            label: 'Industry',
            type: 'select',
            required: true,
            dropdownSource: 'industries',
          }, {
            label: 'Status',
            type: 'select',
            required: true,
            dropdownSource: 'static',
            dropdownOptions: ['Active', 'Inactive', 'Pending'],
          }],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections[0].items[0].dropdownSource).toBe('industries')
      expect(def.sections[0].items[1].dropdownSource).toBe('static')
      expect(def.sections[0].items[1].dropdownOptions).toEqual(['Active', 'Inactive', 'Pending'])
    })

    it('should store download field properties', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Test',
          items: [{
            label: 'Application Form',
            type: 'download',
            required: true,
            downloadFileName: 'application-form.pdf',
            downloadFileSize: 245760,
            downloadFileType: 'pdf',
            downloadFileUrl: '/forms/application-form.pdf',
            downloadIpfsCid: 'QmXyz123',
          }],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const item = def.sections[0].items[0]
      expect(item.type).toBe('download')
      expect(item.downloadFileName).toBe('application-form.pdf')
      expect(item.downloadFileSize).toBe(245760)
      expect(item.downloadFileType).toBe('pdf')
      expect(item.downloadFileUrl).toBe('/forms/application-form.pdf')
      expect(item.downloadIpfsCid).toBe('QmXyz123')
    })

    it('should handle backward-compatible items (label + required only)', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        sections: [{
          category: 'Legacy',
          items: [
            { label: 'Old item', required: true, notes: 'Legacy note' },
          ],
        }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const item = def.sections[0].items[0]
      expect(item.label).toBe('Old item')
      expect(item.type).toBe('file') // default
      expect(item.span).toBe(24) // default
      expect(item.placeholder).toBe('') // default
      expect(item.notes).toBe('Legacy note')
    })
  })

  // ─── Instance methods ──────────────────────────────────────────
  describe('Instance methods', () => {
    it('canEdit should return true only for drafts', async () => {
      const draft = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        status: 'draft',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(draft.canEdit()).toBe(true)

      const published = await FormDefinition.create({
        formType: 'registration',
        version: '2.0',
        status: 'published',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(published.canEdit()).toBe(false)
    })

    it('canSubmitForApproval requires draft + sections', async () => {
      const empty = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        status: 'draft',
        sections: [],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(empty.canSubmitForApproval()).toBe(false)

      const withSections = await FormDefinition.create({
        formType: 'registration',
        version: '2.0',
        status: 'draft',
        sections: [{ category: 'Test', items: [{ label: 'Item', required: true }] }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(withSections.canSubmitForApproval()).toBe(true)
    })

    it('canArchive allows draft and published', async () => {
      const draft = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        status: 'draft',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(draft.canArchive()).toBe(true)

      const published = await FormDefinition.create({
        formType: 'registration',
        version: '2.0',
        status: 'published',
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })
      expect(published.canArchive()).toBe(true)
    })

    it('addChangeLog should append entries', async () => {
      const def = await FormDefinition.create({
        formType: 'registration',
        version: '1.0',
        status: 'draft',
        changeLog: [],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      def.addChangeLog('created', adminUserId, { note: 'test' })
      def.addChangeLog('updated', adminUserId, { sectionsCount: { from: 0, to: 1 } })
      await def.save()

      expect(def.changeLog.length).toBe(2)
      expect(def.changeLog[0].action).toBe('created')
      expect(def.changeLog[1].action).toBe('updated')
    })
  })

  // ─── FormGroup model ───────────────────────────────────────────
  describe('FormGroup model', () => {
    it('should create a form group', async () => {
      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: 'all',
        displayName: 'Business Registration - All Industries',
      })

      expect(group.formType).toBe('registration')
      expect(group.industryScope).toBe('all')
      expect(group.retiredAt).toBeNull()
    })

    it('should support inspections formType', async () => {
      const group = await FormGroup.create({
        formType: 'inspections',
        industryScope: 'i',
        displayName: 'Inspections - Food Service',
      })
      expect(group.formType).toBe('inspections')
    })

    it('should track deactivation fields', async () => {
      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: 'all',
        displayName: 'Test Group',
      })

      const until = new Date(Date.now() + 86400000) // tomorrow
      group.deactivatedAt = new Date()
      group.deactivatedUntil = until
      group.deactivateReason = 'maintenance'
      await group.save()

      const loaded = await FormGroup.findById(group._id)
      expect(loaded.deactivatedAt).toBeTruthy()
      expect(loaded.deactivatedUntil.getTime()).toBe(until.getTime())
      expect(loaded.deactivateReason).toBe('maintenance')
    })

    it('should support reactivation (clear deactivation fields)', async () => {
      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: 'all',
        displayName: 'Test Group',
        deactivatedAt: new Date(),
        deactivatedUntil: new Date(Date.now() + 86400000),
        deactivateReason: 'updating',
      })

      group.deactivatedAt = null
      group.deactivatedUntil = null
      group.deactivateReason = ''
      await group.save()

      const loaded = await FormGroup.findById(group._id)
      expect(loaded.deactivatedAt).toBeNull()
      expect(loaded.deactivatedUntil).toBeNull()
    })

    it('getFormTypeLabel should return human-readable labels', () => {
      expect(FormGroup.getFormTypeLabel('registration')).toBe('Business Registration')
      expect(FormGroup.getFormTypeLabel('inspections')).toBe('Inspections')
      expect(FormGroup.getFormTypeLabel('unknown')).toBe('unknown')
    })
  })

  // ─── findActiveDefinition ──────────────────────────────────────
  describe('findActiveDefinition', () => {
    beforeEach(async () => {
      await FormDefinition.create([
        {
          formType: 'registration',
          version: '1.0',
          name: 'Global Default',
          status: 'published',
          businessTypes: [],
          lguCodes: [],
          sections: [{ category: 'Global', items: [{ label: 'Item', required: true }] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
        {
          formType: 'registration',
          version: '1.1',
          name: 'Food Service Specific',
          status: 'published',
          businessTypes: ['i'],
          lguCodes: [],
          sections: [{ category: 'F&B', items: [{ label: 'Sanitary', required: true }] }],
          effectiveFrom: new Date('2020-01-01'),
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
      ])
    })

    it('should return global default when no specific match', async () => {
      const result = await FormDefinition.findActiveDefinition('registration', 's', 'MANILA')
      expect(result.name).toBe('Global Default')
    })

    it('should return industry-specific definition', async () => {
      const result = await FormDefinition.findActiveDefinition('registration', 'i', 'MANILA')
      expect(result.name).toBe('Food Service Specific')
    })

    it('should return null for non-existent form type', async () => {
      const result = await FormDefinition.findActiveDefinition('inspections', 'i', 'MANILA')
      expect(result).toBeNull()
    })

    it('should not return draft definitions', async () => {
      await FormDefinition.create({
        formType: 'permit',
        version: '1.0',
        name: 'Draft Permit',
        status: 'draft',
        sections: [{ category: 'Test', items: [{ label: 'Item', required: true }] }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const result = await FormDefinition.findActiveDefinition('permit', 's', 'MANILA')
      expect(result).toBeNull()
    })
  })

  // ─── Seed data validation ──────────────────────────────────────
  describe('Seed data structures', () => {
    it('should accept seed data format with expanded fields', async () => {
      const { globalRegistrationSections } = require('../../../services/admin-service/src/migrations/seedFormDefinitions')

      const def = await FormDefinition.create({
        formType: 'registration',
        version: '2026.1',
        name: 'Seed Test',
        status: 'published',
        sections: globalRegistrationSections,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      expect(def.sections.length).toBeGreaterThan(0)
      // Check LGU section has download field
      const lguSection = def.sections.find((s) => s.category === 'Local Government Unit (LGU)')
      expect(lguSection).toBeTruthy()
      const downloadField = lguSection.items.find((i) => i.type === 'download')
      expect(downloadField).toBeTruthy()
      expect(downloadField.downloadFileName).toBeTruthy()

      // Check Business Information section has text fields
      const bizSection = def.sections.find((s) => s.category === 'Business Information')
      expect(bizSection).toBeTruthy()
      const textField = bizSection.items.find((i) => i.type === 'text')
      expect(textField).toBeTruthy()
      expect(textField.placeholder).toBeTruthy()

      // Check address field
      const addressField = bizSection.items.find((i) => i.type === 'address')
      expect(addressField).toBeTruthy()

      // Check select field with dropdownSource
      const selectField = bizSection.items.find((i) => i.type === 'select')
      expect(selectField).toBeTruthy()
      expect(selectField.dropdownSource).toBe('industries')

      // Check span on date/number fields
      const dateField = bizSection.items.find((i) => i.type === 'date')
      expect(dateField).toBeTruthy()
      expect(dateField.span).toBe(12)
    })

    it('should accept industry-specific seed data', async () => {
      const { industrySections } = require('../../../services/admin-service/src/migrations/seedFormDefinitions')

      // Every PSIC letter should have sections defined
      const psicLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u']

      for (const letter of psicLetters) {
        expect(industrySections[letter]).toBeDefined()
        expect(Array.isArray(industrySections[letter])).toBe(true)
        expect(industrySections[letter].length).toBeGreaterThan(0)

        // Each section should have category and items
        for (const section of industrySections[letter]) {
          expect(section.category).toBeTruthy()
          expect(Array.isArray(section.items)).toBe(true)
          expect(section.items.length).toBeGreaterThan(0)

          for (const itm of section.items) {
            expect(itm.label).toBeTruthy()
          }
        }
      }
    })
  })

  // ─── Version management ─────────────────────────────────────────
  describe('Version management', () => {
    it('should link definitions to form groups', async () => {
      const group = await FormGroup.create({
        formType: 'registration',
        industryScope: 'all',
        displayName: 'Test Group',
      })

      const v1 = await FormDefinition.create({
        formGroupId: group._id,
        formType: 'registration',
        version: '2026.1',
        status: 'published',
        sections: [{ category: 'Test', items: [{ label: 'Item', required: true }] }],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const v2 = await FormDefinition.create({
        formGroupId: group._id,
        formType: 'registration',
        version: '2026.2',
        status: 'draft',
        sections: [],
        createdBy: adminUserId,
        updatedBy: adminUserId,
      })

      const versions = await FormDefinition.find({ formGroupId: group._id }).sort({ version: -1 })
      expect(versions.length).toBe(2)
      expect(versions[0].version).toBe('2026.2')
      expect(versions[1].version).toBe('2026.1')
    })
  })
})
