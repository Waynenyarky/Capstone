/**
 * Link Existing Account Integration Tests
 * Covers UC-2A-2, UC-2A-4, UC-2A-5, UC-2A-6 from Appendix K
 */

const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer, app

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.EMAIL_API_PROVIDER = 'mock'
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  process.env.MONGO_URI = uri
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)

  const authService = require('../../../services/auth-service/src/index')
  app = authService.app
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

const User = require('../../../services/auth-service/src/models/User')
const Role = require('../../../services/auth-service/src/models/Role')
const SignUpRequest = require('../../../services/auth-service/src/models/SignUpRequest')

describe('Link Existing Account (2A)', () => {
  let businessOwnerRole

  beforeAll(async () => {
    businessOwnerRole = await Role.findOneAndUpdate(
      { slug: 'business_owner' },
      { name: 'Business Owner', slug: 'business_owner' },
      { upsert: true, new: true }
    )
  })

  beforeEach(async () => {
    // Clean up link-related data but not roles
    await SignUpRequest.deleteMany({})
    // Only delete test users (not seeded ones)
    await User.deleteMany({ email: { $regex: /link_test_/ } })
  })

  // ── Step 1: POST /api/auth/link-existing-account ──

  describe('POST /api/auth/link-existing-account', () => {
    describe('UC-2A-2: Happy path — send verification code', () => {
      it('should send verification code for new email + BP number', async () => {
        const ts = Date.now()
        const res = await request(app)
          .post('/api/auth/link-existing-account')
          .send({
            email: `link_test_new_${ts}@example.com`,
            businessPlateNo: 'BP-12345',
          })

        expect(res.status).toBe(200)
        expect(res.body.data.verificationSent).toBe(true)
        expect(res.body.data.expiresIn).toBeGreaterThan(0)
      })
    })

    describe('UC-2A-5: BUSINESS_ALREADY_LINKED — email already exists', () => {
      it('should reject when email already has an account', async () => {
        const ts = Date.now()
        const email = `link_test_existing_${ts}@example.com`

        // Create existing user
        const bcrypt = require('bcryptjs')
        await User.create({
          role: businessOwnerRole._id,
          firstName: 'Existing',
          lastName: 'User',
          email,
          phoneNumber: `__unset__link_${ts}`,
          passwordHash: await bcrypt.hash('Test123!@#', 10),
          termsAccepted: true,
          tokenVersion: 0,
        })

        const res = await request(app)
          .post('/api/auth/link-existing-account')
          .send({
            email,
            businessPlateNo: 'BP-12345',
          })

        expect(res.status).toBe(409)
        expect(res.body.error.code).toBe('BUSINESS_ALREADY_LINKED')
      })
    })

    describe('Validation', () => {
      it('should reject missing email', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account')
          .send({ businessPlateNo: 'BP-12345' })

        expect(res.status).toBe(400)
      })

      it('should reject missing businessPlateNo', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account')
          .send({ email: 'test@example.com' })

        expect(res.status).toBe(400)
      })

      it('should reject invalid email format', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account')
          .send({ email: 'not-an-email', businessPlateNo: 'BP-12345' })

        expect(res.status).toBe(400)
      })
    })
  })

  // ── Step 2: POST /api/auth/link-existing-account/verify ──

  describe('POST /api/auth/link-existing-account/verify', () => {
    async function createLinkRequest(email, businessPlateNo = 'BP-12345') {
      const code = '123456'
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
      await SignUpRequest.findOneAndUpdate(
        { email },
        {
          code,
          expiresAt,
          payload: { email, businessPlateNo, linkExisting: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return code
    }

    describe('UC-2A-2: Happy path — verify and create account', () => {
      it('should create linked account on valid code', async () => {
        const ts = Date.now()
        const email = `link_test_verify_${ts}@example.com`
        const code = await createLinkRequest(email)

        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({ email, businessPlateNo: 'BP-12345', code })

        expect(res.status).toBe(201)
        expect(res.body.data.linked).toBe(true)
        expect(res.body.data.userId).toBeDefined()

        // Verify user was created
        const user = await User.findOne({ email })
        expect(user).not.toBeNull()
        expect(user.isEmailVerified).toBe(true)
        expect(user.mustChangeCredentials).toBe(true)
      })
    })

    describe('UC-2A-6: LINK_CODE_EXPIRED', () => {
      it('should reject expired verification code', async () => {
        const ts = Date.now()
        const email = `link_test_expired_${ts}@example.com`

        // Create expired request
        await SignUpRequest.findOneAndUpdate(
          { email },
          {
            code: '123456',
            expiresAt: new Date(Date.now() - 60000), // expired 1 min ago
            payload: { email, businessPlateNo: 'BP-12345', linkExisting: true },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({ email, businessPlateNo: 'BP-12345', code: '123456' })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe('LINK_CODE_EXPIRED')
      })
    })

    describe('UC-2A-4: LINK_CODE_INVALID — wrong code', () => {
      it('should reject wrong verification code', async () => {
        const ts = Date.now()
        const email = `link_test_wrongcode_${ts}@example.com`
        await createLinkRequest(email)

        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({ email, businessPlateNo: 'BP-12345', code: '999999' })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe('LINK_CODE_INVALID')
      })
    })

    describe('LINK_CODE_INVALID — businessPlateNo mismatch', () => {
      it('should reject when BP number does not match request', async () => {
        const ts = Date.now()
        const email = `link_test_mismatch_${ts}@example.com`
        const code = await createLinkRequest(email, 'BP-12345')

        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({ email, businessPlateNo: 'BP-WRONG', code })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe('LINK_CODE_INVALID')
      })
    })

    describe('NOT_FOUND — no link request', () => {
      it('should reject when no link request exists', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({
            email: 'nonexistent@example.com',
            businessPlateNo: 'BP-12345',
            code: '123456',
          })

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe('NOT_FOUND')
      })
    })

    describe('Validation', () => {
      it('should reject missing code', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({ email: 'test@example.com', businessPlateNo: 'BP-12345' })

        expect(res.status).toBe(400)
      })

      it('should reject non-6-digit code', async () => {
        const res = await request(app)
          .post('/api/auth/link-existing-account/verify')
          .send({
            email: 'test@example.com',
            businessPlateNo: 'BP-12345',
            code: 'abc',
          })

        expect(res.status).toBe(400)
      })
    })
  })
})
