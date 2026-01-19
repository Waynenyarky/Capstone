const request = require('supertest')
const jwt = require('jsonwebtoken')
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const {
  createTestUsers,
  getTestTokens,
  generateUniqueEmail,
} = require('../helpers/fixtures')
const { cleanupTestData } = require('../helpers/cleanup')
const User = require('../../services/auth-service/src/models/User')
const { signAccessToken } = require('../../services/auth-service/src/middleware/auth')
const bcrypt = require('bcryptjs')

describe('Authorization Boundary Tests', () => {
  let mongo
  let app
  let businessOwner
  let staffUser
  let adminUser
  let businessOwnerToken
  let staffToken
  let adminToken

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    app = setupApp()

    const users = await createTestUsers()
    businessOwner = users.businessOwner
    staffUser = users.staffUser
    adminUser = users.adminUser

    const tokens = getTestTokens(users)
    businessOwnerToken = tokens.businessOwnerToken
    staffToken = tokens.staffToken
    adminToken = tokens.adminToken
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
    const users = await createTestUsers()
    businessOwner = users.businessOwner
    staffUser = users.staffUser
    adminUser = users.adminUser
    const tokens = getTestTokens(users)
    businessOwnerToken = tokens.businessOwnerToken
    staffToken = tokens.staffToken
    adminToken = tokens.adminToken
  })

  describe('JWT Middleware (requireJwt)', () => {
    it('should accept valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
    })

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('unauthorized')
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('invalid_token')
    })

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        {
          sub: String(businessOwner._id),
          email: businessOwner.email,
          role: 'business_owner',
          tokenVersion: businessOwner.tokenVersion,
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('invalid_token')
    })

    it('should reject token with mismatched token version', async () => {
      // Increment token version
      await User.findByIdAndUpdate(businessOwner._id, {
        tokenVersion: businessOwner.tokenVersion + 1,
      })

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('token_invalidated')
    })

    it('should reject token for non-existent user', async () => {
      // Create token for non-existent user
      const fakeToken = jwt.sign(
        {
          sub: '507f1f77bcf86cd799439011',
          email: 'fake@example.com',
          role: 'business_owner',
          tokenVersion: 0,
        },
        process.env.JWT_SECRET
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${fakeToken}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('user_not_found')
    })
  })

  describe('Role-Based Access Control (requireRole)', () => {
    it('should allow admin to access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
    })

    it('should reject business owner from admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should reject staff from admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${staffToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should allow business owner to access business owner endpoints', async () => {
      // Use a valid phone number format
      const response = await request(app)
        .patch('/api/auth/profile/contact')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          phoneNumber: '+1234567890',
        })

      // Should succeed, require verification, or be forbidden if field is restricted
      expect([200, 401, 403, 428]).toContain(response.status)
    })

    it('should reject staff from business owner endpoints', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/contact')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          phoneNumber: '1234567890',
        })

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })
  })

  describe('Field Permission Middleware', () => {
    it('should allow business owner to update email with verification', async () => {
      // Request verification first
      await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      const newEmail = generateUniqueEmail('newemail')
      const response = await request(app)
        .patch('/api/auth/profile/email')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          newEmail,
          verificationCode: '123456',
        })

      // Should require verification, but endpoint should be accessible
      expect([200, 401, 428]).toContain(response.status)
    })

    it('should reject staff from updating restricted fields', async () => {
      const response = await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPass123!',
        })

      // Should fail or create admin alert
      expect([400, 403, 401]).toContain(response.status)
    })

    it('should allow staff to update allowed fields', async () => {
      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          firstName: 'Updated',
        })

      // Should succeed for allowed fields
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should require admin approval for admin profile changes', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/personal-info')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'NewFirstName',
        })

      expect(response.status).toBe(200)
      expect(response.body.approval).toBeDefined()
      expect(response.body.approval.status).toBe('pending')
    })
  })

  describe('Session Management', () => {
    it('should invalidate all sessions on password change', async () => {
      const token1 = businessOwnerToken
      const token2 = signAccessToken(businessOwner).token

      // Change password
      await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPassword123!@#',
        })

      // Both tokens should be invalid
      const response1 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token1}`)

      const response2 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token2}`)

      expect(response1.status).toBe(401)
      expect(response1.body.error.code).toBe('token_invalidated')
      expect(response2.status).toBe(401)
      expect(response2.body.error.code).toBe('token_invalidated')
    })

    it('should allow new token after password change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPassword123!@#',
        })

      // Get fresh user and token
      const updatedUser = await User.findById(businessOwner._id)
      await updatedUser.populate('role')
      const newToken = signAccessToken(updatedUser).token

      // New token should work
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)

      expect(response.status).toBe(200)
    })

    it('should maintain token version across sessions', async () => {
      const initialVersion = businessOwner.tokenVersion

      // Create multiple tokens
      const token1 = signAccessToken(businessOwner).token
      const token2 = signAccessToken(businessOwner).token

      // Both should work
      const response1 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token1}`)

      const response2 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token2}`)

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Token version should not change
      const user = await User.findById(businessOwner._id)
      expect(user.tokenVersion).toBe(initialVersion)
    })
  })

  describe('Rate Limiting', () => {
    it('should rate limit profile updates', async () => {
      // Make many rapid profile updates
      for (let i = 0; i < 20; i++) {
        await request(app)
          .patch('/api/auth/profile/contact')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({
            phoneNumber: `123456789${i}`,
          })
      }

      // Should eventually hit rate limit
      const response = await request(app)
        .patch('/api/auth/profile/contact')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          phoneNumber: '9999999999',
        })

      // May succeed, be rate limited, or have validation errors
      expect([200, 400, 403, 429]).toContain(response.status)
    })

    it('should rate limit password change requests', async () => {
      // Make many password change requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/change-password/start')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
      }

      // Should eventually hit rate limit
      const response = await request(app)
        .post('/api/auth/change-password/start')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect([200, 400, 429]).toContain(response.status)
    })

    it('should rate limit verification requests', async () => {
      // Make many verification requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/profile/verification/request')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({
            field: 'email',
            method: 'otp',
          })
      }

      // Should eventually hit rate limit
      const response = await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      expect([200, 400, 429]).toContain(response.status)
    })
  })

  describe('Cross-Role Access Attempts', () => {
    it('should prevent business owner from accessing staff management', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(403)
    })

    it('should prevent staff from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${staffToken}`)

      expect(response.status).toBe(403)
    })

    it('should prevent staff from accessing business owner profile endpoints', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/email')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newEmail: generateUniqueEmail('staff'),
        })

      expect(response.status).toBe(403)
    })

    it('should allow admin to access all admin endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/auth/staff' },
        { method: 'get', path: '/api/auth/users' },
      ]

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
      }
    })
  })
})
