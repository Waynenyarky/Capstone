/**
 * Edit Requests Integration Tests
 * Covers UC-2N-1 through UC-2N-6 from Appendix K
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

const EditRequest = require('../../../services/business-service/src/models/EditRequest')
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
    lastName: 'Edit',
    email: `owner_edit_${ts}@test.com`,
    phoneNumber: `__unset__edit_${ts}_o`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  ownerId = owner._id.toString()
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token

  const staff = await User.create({
    role: staffRole._id,
    firstName: 'Staff',
    lastName: 'Edit',
    email: `staff_edit_${ts}@test.com`,
    phoneNumber: `__unset__edit_${ts}_s`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  })
  staffId = staff._id.toString()
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token
}

describe('Edit Requests (2N)', () => {
  beforeAll(async () => {
    await setupUsers()
  })

  beforeEach(async () => {
    await EditRequest.deleteMany({})
  })

  // ── Happy Paths ──

  describe('UC-2N-1: Owner requests address change', () => {
    it('should create edit request for allowed field', async () => {
      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-001',
          fieldName: 'address',
          currentValue: '123 Old Street',
          requestedValue: '456 New Avenue',
          reason: 'We moved to a new location',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.status).toBe('pending')
      expect(res.body.data.fieldName).toBe('address')
      expect(res.body.data.requestedBy).toBe(ownerId)
    })
  })

  describe('UC-2N-1: Officer approves edit request', () => {
    it('should approve and record reviewer', async () => {
      const editReq = await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'tradeName',
        currentValue: 'Old Name',
        requestedValue: 'New Name',
        reason: 'Rebranding',
        status: 'pending',
      })

      const res = await request(app)
        .put(`/api/business/edit-requests/${editReq._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'approved',
          reviewNotes: 'Verified supporting documents.',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('approved')
      expect(res.body.data.reviewedBy).toBe(staffId)
      expect(res.body.data.resolvedAt).toBeDefined()
    })
  })

  describe('UC-2N-2: Officer rejects edit request', () => {
    it('should reject with comment', async () => {
      const editReq = await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'capital',
        currentValue: '100000',
        requestedValue: '500000',
        reason: 'Capital increase',
        status: 'pending',
      })

      const res = await request(app)
        .put(`/api/business/edit-requests/${editReq._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'rejected',
          reviewNotes: 'Insufficient supporting documentation.',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('rejected')
      expect(res.body.data.reviewNotes).toBe('Insufficient supporting documentation.')
    })
  })

  // ── Edge Cases ──

  describe('UC-2N-3: Disallowed field (BP number)', () => {
    it('should reject edit of businessPlateNo', async () => {
      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-001',
          fieldName: 'businessPlateNo',
          currentValue: 'BP-001',
          requestedValue: 'BP-999',
          reason: 'Want to change BP number',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('FIELD_NOT_EDITABLE')
    })

    it('should reject edit of taxpayerName', async () => {
      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-001',
          fieldName: 'taxpayerName',
          currentValue: 'John',
          requestedValue: 'Jane',
          reason: 'Name change',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('FIELD_NOT_EDITABLE')
    })
  })

  describe('UC-2N-6: Duplicate pending edit request', () => {
    it('should reject duplicate for same field on same business', async () => {
      await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'address',
        currentValue: '123 Street',
        requestedValue: '456 Avenue',
        reason: 'Moving',
        status: 'pending',
      })

      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-001',
          fieldName: 'address',
          currentValue: '123 Street',
          requestedValue: '789 Boulevard',
          reason: 'Actually moving here instead',
        })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DUPLICATE_EDIT_REQUEST')
    })

    it('should allow same field on different business', async () => {
      await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'address',
        currentValue: '123 Street',
        requestedValue: '456 Avenue',
        reason: 'Moving',
        status: 'pending',
      })

      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-002',
          fieldName: 'address',
          currentValue: '789 Road',
          requestedValue: '101 Lane',
          reason: 'Other business moving',
        })

      expect(res.status).toBe(201)
    })

    it('should allow after previous request is resolved', async () => {
      await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'tradeName',
        currentValue: 'Old',
        requestedValue: 'New',
        reason: 'Rebrand',
        status: 'rejected',
      })

      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessId: 'BIZ-001',
          fieldName: 'tradeName',
          currentValue: 'Old',
          requestedValue: 'Better Name',
          reason: 'Second attempt',
        })

      expect(res.status).toBe(201)
    })
  })

  describe('Cannot update resolved requests', () => {
    it('should reject update on approved request', async () => {
      const editReq = await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'address',
        currentValue: 'Old',
        requestedValue: 'New',
        status: 'approved',
        resolvedAt: new Date(),
      })

      const res = await request(app)
        .put(`/api/business/edit-requests/${editReq._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'rejected' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('ALREADY_RESOLVED')
    })
  })

  describe('Validation', () => {
    it('should require businessId, fieldName, requestedValue', async () => {
      const res = await request(app)
        .post('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ businessId: 'BIZ-001' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent edit request', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .put(`/api/business/edit-requests/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'approved' })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /edit-requests — list', () => {
    it('should list edit requests', async () => {
      await EditRequest.create({
        businessId: 'BIZ-001',
        requestedBy: ownerId,
        fieldName: 'address',
        currentValue: 'Old',
        requestedValue: 'New',
        status: 'pending',
      })

      const res = await request(app)
        .get('/api/business/edit-requests')
        .set('Authorization', `Bearer ${ownerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })
  })
})
