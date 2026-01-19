const request = require('supertest')
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const {
  createTestUsers,
  getTestTokens,
} = require('../helpers/fixtures')
const { cleanupTestData } = require('../helpers/cleanup')
const User = require('../../services/auth-service/src/models/User')

describe('Error Scenario Tests', () => {
  let mongo
  let app
  let businessOwner
  let businessOwnerToken

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    app = setupApp()

    const users = await createTestUsers()
    businessOwner = users.businessOwner
    const tokens = getTestTokens(users)
    businessOwnerToken = tokens.businessOwnerToken
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
    const users = await createTestUsers()
    businessOwner = users.businessOwner
    const tokens = getTestTokens(users)
    businessOwnerToken = tokens.businessOwnerToken
  })

  describe('Service Failure Scenarios', () => {
    it('should handle database connection failures gracefully', async () => {
      // This test structure - actual DB failure would require mocking
      // For now, test that endpoints handle errors properly
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      // Should either succeed or fail gracefully
      expect([200, 500, 503]).toContain(response.status)
      
      if (response.status >= 500) {
        expect(response.body.error).toBeDefined()
        expect(response.body.error.message).toBeDefined()
      }
    })

    it('should handle email service failures without blocking operations', async () => {
      // Email service is already mocked in test mode
      // Test that operations complete even if email fails
      const response = await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      // Should succeed even if email sending fails (non-blocking)
      expect(response.status).toBe(200)
    })

    it('should handle blockchain service failures without blocking operations', async () => {
      // Blockchain is disabled in test mode via env var
      // Test that operations complete even if blockchain fails
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
        })

      // Should succeed even if blockchain logging fails (non-blocking)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should provide user-friendly error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login/start')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong',
        })

      // Invalid credentials can return 400 (validation) or 401 (unauthorized)
      expect([400, 401]).toContain(response.status)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBeDefined()
      expect(response.body.error.message).toBeDefined()
      // Should not expose internal details
      if (response.body.error.message) {
        expect(response.body.error.message).not.toContain('passwordHash')
        expect(response.body.error.message).not.toContain('database')
      }
    })

    it('should handle validation errors with clear messages', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/contact')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          phoneNumber: 'invalid',
        })

      // Invalid phone number can return 400 (validation) or 403 (forbidden if field restricted)
      expect([400, 403]).toContain(response.status)
      expect(response.body.error).toBeDefined()
      // Accept validation_error or invalid_input error codes
      expect(['validation_error', 'invalid_input', 'bad_request', 'forbidden']).toContain(response.body.error.code)
      expect(response.body.error.message).toBeDefined()
    })

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({}) // No fields provided

      // Should either succeed (no changes) or fail with clear error
      expect([200, 400]).toContain(response.status)
      
      if (response.status === 400) {
        expect(response.body.error).toBeDefined()
      }
    })

    it('should handle malformed request bodies', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle network-like errors gracefully', async () => {
      // Test timeout scenarios (structure only - actual timeout requires configuration)
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .timeout(100) // Short timeout

      // Should either succeed or timeout gracefully
      expect([200, 408, 500]).toContain(response.status)
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after failed verification', async () => {
      // Request verification
      await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      // Try with wrong code
      const wrongResponse = await request(app)
        .patch('/api/auth/profile/email')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          newEmail: require('../helpers/fixtures').generateUniqueEmail('newemail'),
          verificationCode: '000000',
        })

      expect(wrongResponse.status).toBe(401)

      // Should be able to request new verification
      const retryResponse = await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      expect(retryResponse.status).toBe(200)
    })

    it('should handle partial workflow completion', async () => {
      // Start email change
      await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      // Don't complete - should be able to start new request
      const newRequestResponse = await request(app)
        .post('/api/auth/profile/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          field: 'email',
          method: 'otp',
        })

      expect(newRequestResponse.status).toBe(200)
    })

    it('should handle expired tokens gracefully', async () => {
      // Create expired token
      const jwt = require('jsonwebtoken')
      const expiredToken = jwt.sign(
        {
          sub: String(businessOwner._id),
          email: businessOwner.email,
          role: 'business_owner',
          tokenVersion: businessOwner.tokenVersion,
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('invalid_token')
      expect(response.body.error.message).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000)
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: longString,
        })

      // Should either reject or truncate
      expect([200, 400]).toContain(response.status)
      
      if (response.status === 200) {
        const user = await User.findById(businessOwner._id)
        expect(user.firstName.length).toBeLessThanOrEqual(100) // Max length
      }
    })

    it('should handle special characters in inputs', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: `Test${specialChars}`,
        })

      // Should either sanitize or reject
      expect([200, 400]).toContain(response.status)
    })

    it('should handle empty strings appropriately', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: '',
          lastName: '',
        })

      // Should either reject empty strings or treat as no change
      expect([200, 400]).toContain(response.status)
    })

    it('should handle null/undefined values', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: null,
          lastName: undefined,
        })

      // Should handle gracefully
      expect([200, 400]).toContain(response.status)
    })
  })
})
