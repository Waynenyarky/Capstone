/**
 * Post-Requirements Integration Tests
 * Covers UC-2I-1 through UC-2I-9 from Appendix K
 */

const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer, app

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  // Connect the business-service's own mongoose (it has its own node_modules/mongoose)
  const bsMongoose = require('../../../services/business-service/src/models/Role').base
  await bsMongoose.connect(uri)

  const businessService = require('../../../services/business-service/src/index')
  app = businessService.app
})

afterAll(async () => {
  const bsMongoose = require('../../../services/business-service/src/models/Role').base
  await bsMongoose.disconnect()
  await mongoServer.stop()
})

const PostRequirement = require('../../../services/business-service/src/models/PostRequirement')
const User = require('../../../services/business-service/src/models/User')
const Role = require('../../../services/business-service/src/models/Role')
const { signAccessToken } = require('../../../services/business-service/src/middleware/auth')

let ownerToken, staffToken, ownerId, staffId

async function setupUsers() {
  const bcrypt = require('bcryptjs')
  const ts = Date.now()

  const ownerRole = await Role.findOneAndUpdate(
    { slug: 'business_owner' },
    { name: 'Business Owner', slug: 'business_owner' },
    { upsert: true, new: true }
  )
  const staffRole = await Role.findOneAndUpdate(
    { slug: 'lgu_officer' },
    { name: 'LGU Officer', slug: 'lgu_officer' },
    { upsert: true, new: true }
  )

  const owner = await User.create({
    role: ownerRole._id,
    firstName: 'Owner',
    lastName: 'PostReq',
    email: `owner_pr_${ts}@test.com`,
    phoneNumber: `__unset__pr_${ts}_o`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  ownerId = owner._id.toString()
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token

  const staff = await User.create({
    role: staffRole._id,
    firstName: 'Officer',
    lastName: 'PostReq',
    email: `officer_pr_${ts}@test.com`,
    phoneNumber: `__unset__pr_${ts}_s`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  })
  staffId = staff._id.toString()
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token
}

describe('Post-Requirements (2I)', () => {
  beforeAll(async () => {
    await setupUsers()
  })

  beforeEach(async () => {
    await PostRequirement.deleteMany({})
  })

  // ── Happy Paths ──

  describe('UC-2I-1: System creates post-requirements on permit issuance', () => {
    it('should create post-requirement with 30-day default due date', async () => {
      const res = await request(app)
        .post('/api/business/post-requirements')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessId: 'BIZ-001',
          ownerId,
          requirementType: 'real_property_tax',
          description: 'Real Property Tax clearance',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('pending')
      expect(res.body.data.requirementType).toBe('real_property_tax')
      // Due date should be ~30 days from now
      const dueDate = new Date(res.body.data.dueDate)
      const now = new Date()
      const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(28)
      expect(diffDays).toBeLessThan(32)
    })
  })

  describe('UC-2I-2: Owner submits document', () => {
    it('should update status to submitted', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'submitted',
          submittedDocuments: ['uploads/rpt_clearance.pdf'],
        })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('submitted')
      expect(res.body.data.submittedAt).toBeDefined()
    })
  })

  describe('UC-2I-2: Officer verifies submission', () => {
    it('should verify and record verifier', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'submitted',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'verified',
          verificationNotes: 'Document is valid and complete.',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('verified')
      expect(res.body.data.verifiedBy).toBe(staffId)
      expect(res.body.data.verifiedAt).toBeDefined()
    })
  })

  describe('UC-2I-5: Officer marks non-compliant', () => {
    it('should mark as non_compliant with notes', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'sanitary',
        status: 'submitted',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'non_compliant',
          verificationNotes: 'Wrong clearance type submitted.',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('non_compliant')
      expect(res.body.data.verificationNotes).toBe('Wrong clearance type submitted.')
    })
  })

  // ── Edge Cases ──

  describe('UC-2I-8: Officer extends due date', () => {
    it('should extend due date with reason', async () => {
      const originalDue = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      const newDue = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: originalDue,
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}/extend`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newDueDate: newDue.toISOString(),
          reason: 'Owner requested extension due to document processing delay.',
        })

      expect(res.status).toBe(200)
      expect(new Date(res.body.data.dueDate).getTime()).toBe(newDue.getTime())
    })

    it('should not extend a verified requirement', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'verified',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}/extend`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Trying to extend verified',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('ALREADY_VERIFIED')
    })

    it('should reject extension with past date', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}/extend`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newDueDate: new Date('2020-01-01').toISOString(),
          reason: 'Past date',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should require newDueDate', async () => {
      const postReq = await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .put(`/api/business/post-requirements/${postReq._id}/extend`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ reason: 'No date provided' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('UC-2I-3: Overdue detection in listing', () => {
    it('should mark overdue requirements in response', async () => {
      await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: new Date('2020-01-01'), // Past due
      })

      const res = await request(app)
        .get('/api/business/post-requirements')
        .set('Authorization', `Bearer ${ownerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
      expect(res.body.data[0].isOverdue).toBe(true)
    })

    it('should not mark future requirements as overdue', async () => {
      await PostRequirement.create({
        businessId: 'BIZ-001',
        ownerId,
        requirementType: 'real_property_tax',
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app)
        .get('/api/business/post-requirements')
        .set('Authorization', `Bearer ${ownerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].isOverdue).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should require businessId and requirementType', async () => {
      const res = await request(app)
        .post('/api/business/post-requirements')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject past dueDate on creation', async () => {
      const res = await request(app)
        .post('/api/business/post-requirements')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessId: 'BIZ-001',
          requirementType: 'real_property_tax',
          dueDate: new Date('2020-01-01').toISOString(),
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent post-requirement', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .put(`/api/business/post-requirements/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'verified' })

      expect(res.status).toBe(404)
    })
  })
})
