/**
 * Fee Configuration Integration Tests
 * Covers UC-2C-1, UC-2C-5, UC-2C-6 from Appendix K
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

const FeeConfiguration = require('../../../services/business-service/src/models/FeeConfiguration')
const User = require('../../../services/business-service/src/models/User')
const Role = require('../../../services/business-service/src/models/Role')
const { signAccessToken } = require('../../../services/business-service/src/middleware/auth')

let adminToken, ownerToken, adminId

async function setupUsers() {
  const bcrypt = require('bcryptjs')
  const ts = Date.now()

  const adminRole = await Role.findOneAndUpdate(
    { slug: 'admin' },
    { name: 'Admin', slug: 'admin' },
    { upsert: true, new: true }
  )
  const ownerRole = await Role.findOneAndUpdate(
    { slug: 'business_owner' },
    { name: 'Business Owner', slug: 'business_owner' },
    { upsert: true, new: true }
  )

  const admin = await User.create({
    role: adminRole._id,
    firstName: 'Admin',
    lastName: 'FeeConfig',
    email: `admin_fee_${ts}@test.com`,
    phoneNumber: `__unset__fee_${ts}_a`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  adminId = admin._id.toString()
  adminToken = signAccessToken({ ...admin.toObject(), role: adminRole }).token

  const owner = await User.create({
    role: ownerRole._id,
    firstName: 'Owner',
    lastName: 'FeeConfig',
    email: `owner_fee_${ts}@test.com`,
    phoneNumber: `__unset__fee_${ts}_o`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token
}

describe('Fee Configuration (2C)', () => {
  beforeAll(async () => {
    await setupUsers()
  })

  beforeEach(async () => {
    await FeeConfiguration.deleteMany({})
  })

  // ── Happy Paths ──

  describe('UC-2C-1: Admin creates fee config', () => {
    it('should create fee configuration with brackets and taxCode (Charter 1-12)', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taxCode: '12',
          lineOfBusiness: 'General Merchandise, Grocery, Sari-Sari Store - 5-9 sq.m.',
          mayorsPermitFee: 600,
          businessTaxCategory: 'Annex 1 (d) — Retailers',
          brackets: [
            { min: 0, max: 100000, rate: 0.5 },
            { min: 100001, max: 400000, rate: 1 },
            { min: 400001, max: null, rate: 1.5 },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.taxCode).toBe('12')
      expect(res.body.data.lineOfBusiness).toBe('General Merchandise, Grocery, Sari-Sari Store - 5-9 sq.m.')
      expect(res.body.data.brackets).toHaveLength(3)
      expect(res.body.data.isActive).toBe(true)
    })

    it('should create fee configuration without taxCode (defaults to empty)', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'Wholesale',
          mayorsPermitFee: 800,
        })

      expect(res.status).toBe(201)
      expect(res.body.data.taxCode).toBe('')
      expect(res.body.data.lineOfBusiness).toBe('Wholesale')
    })

    it('should create fee configuration with bracketKind tiered', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taxCode: '6',
          lineOfBusiness: 'Restaurants - Less than 50 sq.m.',
          mayorsPermitFee: 1800,
          bracketKind: 'tiered',
          brackets: [
            { min: 0, max: 400000, rate: 2.2 },
            { min: 400001, max: null, rate: 1.1 },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.bracketKind).toBe('tiered')
      expect(res.body.data.brackets).toHaveLength(2)
    })

    it('should create fee configuration with bracketKind fixed and bracket amount', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taxCode: '1',
          lineOfBusiness: 'Food Manufacturing',
          mayorsPermitFee: 1000,
          bracketKind: 'fixed',
          brackets: [
            { min: 0, max: 9999, amount: 99.5 },
            { min: 10000, max: 49999, amount: 199.5 },
            { min: 50000, max: null, amount: 299.5 },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.bracketKind).toBe('fixed')
      expect(res.body.data.brackets[0].amount).toBe(99.5)
    })
  })

  describe('Admin updates fee config', () => {
    it('should update mayorsPermitFee', async () => {
      const config = await FeeConfiguration.create({
        lineOfBusiness: 'food',
        mayorsPermitFee: 300,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .put(`/api/business/admin/fee-configuration/${config._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mayorsPermitFee: 600 })

      expect(res.status).toBe(200)
      expect(res.body.data.mayorsPermitFee).toBe(600)
    })

    it('should update taxCode', async () => {
      const config = await FeeConfiguration.create({
        taxCode: '',
        lineOfBusiness: 'Services',
        mayorsPermitFee: 1200,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .put(`/api/business/admin/fee-configuration/${config._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ taxCode: '11' })

      expect(res.status).toBe(200)
      expect(res.body.data.taxCode).toBe('11')
    })
  })

  describe('Admin lists fee configs', () => {
    it('should list all fee configurations with taxCode', async () => {
      await FeeConfiguration.create({
        taxCode: 'RET',
        lineOfBusiness: 'retail',
        mayorsPermitFee: 500,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })
      await FeeConfiguration.create({
        taxCode: 'FDS',
        lineOfBusiness: 'food',
        mayorsPermitFee: 300,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .get('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(2)
      expect(res.body.data[0]).toHaveProperty('taxCode')
    })
  })

  // ── Edge Cases ──

  describe('UC-2C-6: Duplicate (taxCode, lineOfBusiness)', () => {
    it('should reject duplicate active config for same tax code and LOB', async () => {
      await FeeConfiguration.create({
        taxCode: '12',
        lineOfBusiness: 'General Merchandise - below 5 sq.m.',
        mayorsPermitFee: 500,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taxCode: '12',
          lineOfBusiness: 'General Merchandise - below 5 sq.m.',
          mayorsPermitFee: 600,
        })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CONFLICT')
    })
  })

  describe('UC-2C-5: Cannot delete last active config', () => {
    it('should soft-deactivate instead of hard delete', async () => {
      const config = await FeeConfiguration.create({
        taxCode: '12',
        lineOfBusiness: 'Retail',
        mayorsPermitFee: 500,
        brackets: [],
        effectiveDate: new Date(),
        isActive: true,
      })

      const res = await request(app)
        .delete(`/api/business/admin/fee-configuration/${config._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.deactivated).toBe(true)

      // Verify it's deactivated, not deleted
      const updated = await FeeConfiguration.findById(config._id)
      expect(updated).not.toBeNull()
      expect(updated.isActive).toBe(false)
    })
  })

  describe('Bracket validation', () => {
    it('should reject brackets with negative min', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'manufacturing',
          mayorsPermitFee: 1000,
          brackets: [{ min: -100, max: 50000, rate: 1 }],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject brackets with rate > 100', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'manufacturing',
          mayorsPermitFee: 1000,
          brackets: [{ min: 0, max: 50000, rate: 150 }],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject brackets where max < min', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'manufacturing',
          mayorsPermitFee: 1000,
          brackets: [{ min: 50000, max: 10000, rate: 1 }],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject fixed bracketKind when bracket missing amount', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'manufacturing_fixed',
          mayorsPermitFee: 1000,
          bracketKind: 'fixed',
          brackets: [{ min: 0, max: 50000, rate: 1 }],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
      expect(res.body.error.message).toMatch(/amount is required when bracketKind is fixed/i)
    })

    it('should reject rate/tiered bracketKind when bracket missing rate', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineOfBusiness: 'retail',
          mayorsPermitFee: 500,
          bracketKind: 'tiered',
          brackets: [{ min: 0, max: 100000, amount: 100 }],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
      expect(res.body.error.message).toMatch(/rate is required/i)
    })
  })

  describe('Authorization', () => {
    it('should reject non-admin from creating config', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          lineOfBusiness: 'retail',
          mayorsPermitFee: 500,
        })

      expect(res.status).toBe(403)
    })
  })

  describe('Validation', () => {
    it('should require lineOfBusiness and mayorsPermitFee', async () => {
      const res = await request(app)
        .post('/api/business/admin/fee-configuration')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent config on update', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .put(`/api/business/admin/fee-configuration/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mayorsPermitFee: 999 })

      expect(res.status).toBe(404)
    })

    it('should return 404 for non-existent config on delete', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .delete(`/api/business/admin/fee-configuration/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(404)
    })
  })
})
