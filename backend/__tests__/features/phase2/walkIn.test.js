/**
 * Walk-In Application Integration Tests
 * Covers UC-2D-1 through UC-2D-11 from Appendix K
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

const BusinessProfile = require('../../../services/business-service/src/models/BusinessProfile')
const FeeConfiguration = require('../../../services/business-service/src/models/FeeConfiguration')
const User = require('../../../services/business-service/src/models/User')
const Role = require('../../../services/business-service/src/models/Role')
const { signAccessToken } = require('../../../services/business-service/src/middleware/auth')

let staffToken, ownerToken, staffId, ownerId

async function setupUsers() {
  const bcrypt = require('bcryptjs')
  const ts = Date.now()

  const staffRole = await Role.findOneAndUpdate(
    { slug: 'lgu_officer' },
    { name: 'LGU Officer', slug: 'lgu_officer' },
    { upsert: true, new: true }
  )
  const ownerRole = await Role.findOneAndUpdate(
    { slug: 'business_owner' },
    { name: 'Business Owner', slug: 'business_owner' },
    { upsert: true, new: true }
  )

  const staff = await User.create({
    role: staffRole._id,
    firstName: 'Officer',
    lastName: 'WalkIn',
    email: `officer_walkin_${ts}@test.com`,
    phoneNumber: `__unset__walkin_${ts}_s`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  })
  staffId = staff._id.toString()
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token

  const owner = await User.create({
    role: ownerRole._id,
    firstName: 'Owner',
    lastName: 'WalkIn',
    email: `owner_walkin_${ts}@test.com`,
    phoneNumber: `__unset__walkin_${ts}_o`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  ownerId = owner._id.toString()
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token
}

describe('Walk-In Application (2D)', () => {
  beforeAll(async () => {
    await setupUsers()
  })

  beforeEach(async () => {
    await BusinessProfile.deleteMany({})
    await FeeConfiguration.deleteMany({})
  })

  const validBusinessData = {
    registeredBusinessName: 'Walk-In Test Business',
    businessName: 'Walk-In Test Business',
    applicationType: 'new',
    organizationType: 'sole_proprietorship',
    street: '123 Main St',
    barangay: 'Brgy. Centro',
    cityMunicipality: 'General Trias',
  }

  // ── Happy Paths ──

  describe('UC-2D-1: Officer creates walk-in application', () => {
    it('should create application and return computed fees', async () => {
      // Seed fee config
      await FeeConfiguration.create({
        lineOfBusiness: 'retail',
        mayorsPermitFee: 500,
        brackets: [{ min: 0, max: null, rate: 1 }],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessData: validBusinessData,
          businessActivities: [
            { lineOfBusiness: 'retail', grossSales: 200000 },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.businessId).toBeDefined()
      expect(res.body.data.applicationId).toBeDefined()
      expect(res.body.data.computedFees).toBeDefined()
      expect(res.body.data.computedFees.total).toBeGreaterThan(0)
    })
  })

  describe('UC-2D-5: Officer saves walk-in as draft', () => {
    it('should save as draft when draft=true', async () => {
      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessData: validBusinessData,
          draft: true,
        })

      expect(res.status).toBe(201)
      // Verify it's saved as draft
      const profile = await BusinessProfile.findOne({})
      const biz = profile.businesses[0]
      expect(biz.applicationStatus).toBe('draft')
      expect(biz.isSubmitted).toBe(false)
    })
  })

  describe('UC-2D-2: Officer creates PIS if not found', () => {
    it('should create new profile when applicant has no profile', async () => {
      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          applicantUserId: ownerId,
          businessData: validBusinessData,
        })

      expect(res.status).toBe(201)
      // Verify profile was created for the applicant
      const profile = await BusinessProfile.findOne({ userId: ownerId })
      expect(profile).not.toBeNull()
      expect(profile.businesses).toHaveLength(1)
    })
  })

  describe('UC-2D-8: Walk-in for user with multiple businesses', () => {
    it('should add new business to existing profile', async () => {
      // Create existing profile with one business
      await BusinessProfile.create({
        userId: staffId,
        businesses: [{
          businessId: 'BIZ-EXISTING',
          businessName: 'Existing Business',
          businessRegistrationNumber: 'BRN-001',
          isPrimary: true,
        }],
      })

      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessData: {
            ...validBusinessData,
            registeredBusinessName: 'Second Business',
          },
        })

      expect(res.status).toBe(201)
      const profile = await BusinessProfile.findOne({ userId: staffId })
      expect(profile.businesses).toHaveLength(2)
      expect(profile.businesses[1].isPrimary).toBe(false)
    })
  })

  // ── Edge Cases ──

  describe('Fee computation with missing config', () => {
    it('should still create application even if fee config is missing', async () => {
      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessData: validBusinessData,
          businessActivities: [
            { lineOfBusiness: 'unknown_business', grossSales: 100000 },
          ],
        })

      expect(res.status).toBe(201)
      // Fees should be 0 but application still created
      expect(res.body.data.computedFees.total).toBe(0)
      expect(res.body.data.computedFees.warnings).toBeDefined()
    })
  })

  describe('Compute fees endpoint', () => {
    it('should compute fees for given activities', async () => {
      await FeeConfiguration.create({
        lineOfBusiness: 'food',
        mayorsPermitFee: 300,
        brackets: [{ min: 0, max: null, rate: 2 }],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .post('/api/business/walk-in/any-biz/compute-fees')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          businessActivities: [
            { lineOfBusiness: 'food', grossSales: 100000 },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.data.mayorsPermitFee).toBe(300)
      expect(res.body.data.businessTax).toBe(2000) // 100000 * 2%
      expect(res.body.data.total).toBe(2300)
    })
  })

  describe('Validation', () => {
    it('should require businessData', async () => {
      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Authorization', () => {
    it('should reject non-staff from creating walk-in', async () => {
      const res = await request(app)
        .post('/api/business/walk-in')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessData: validBusinessData,
        })

      expect(res.status).toBe(403)
    })
  })
})
