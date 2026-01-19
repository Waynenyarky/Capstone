const request = require('supertest')
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const {
  createTestUser,
} = require('../helpers/fixtures')
const { cleanupTestData } = require('../helpers/cleanup')
const User = require('../../services/auth-service/src/models/User')
const { signAccessToken } = require('../../services/auth-service/src/middleware/auth')
const jwt = require('jsonwebtoken')

describe('Session Management Tests', () => {
  let mongo
  let app
  let testUser
  let testToken

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    app = setupApp()

    testUser = await createTestUser({
      roleSlug: 'business_owner',
    })
    testToken = signAccessToken(testUser).token
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
    testUser = await createTestUser({
      roleSlug: 'business_owner',
    })
    testToken = signAccessToken(testUser).token
  })

  describe('Token Version Management', () => {
    it('should include tokenVersion in JWT', () => {
      const user = {
        _id: '123',
        email: 'test@example.com',
        role: { slug: 'user' },
        tokenVersion: 5,
      }
      const { token } = signAccessToken(user)
      const decoded = jwt.decode(token)
      expect(decoded.tokenVersion).toBe(5)
    })

    it('should reject token with outdated tokenVersion', async () => {
      // Sign token with version 0
      const token = signAccessToken(testUser).token

      // Increment user's tokenVersion (simulating password change)
      await User.findByIdAndUpdate(testUser._id, {
        tokenVersion: testUser.tokenVersion + 1,
      })

      // Try to use old token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('token_invalidated')
    })

    it('should invalidate all sessions on password change', async () => {
      const token1 = signAccessToken(testUser).token
      const token2 = signAccessToken(testUser).token

      // Change password
      await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewStrongPass123!',
        })

      // Both tokens should be invalid
      const response1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)

      const response2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`)

      expect(response1.status).toBe(401)
      expect(response1.body.error.code).toBe('token_invalidated')
      expect(response2.status).toBe(401)
      expect(response2.body.error.code).toBe('token_invalidated')
    })
  })
})
