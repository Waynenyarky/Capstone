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
const AuditLog = require('../../services/auth-service/src/models/AuditLog')

describe('Security Comprehensive Tests', () => {
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

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in email field', async () => {
      const sqlInjectionPayloads = [
        "admin' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin' OR '1'='1' --",
        "' OR 1=1--",
      ]

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login/start')
          .send({ email: payload, password: 'test' })

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.body.error).toBeDefined()
        // Should not expose database errors
        expect(response.body.error.message).not.toContain('SQL')
        expect(response.body.error.message).not.toContain('syntax')
      }
    })

    it('should prevent SQL injection in profile update fields', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR 1=1--",
        "admin' OR '1'='1",
      ]

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .patch('/api/auth/profile/name')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ firstName: payload, lastName: 'Test' })

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.body.error).toBeDefined()
      }
    })

    it('should sanitize SQL injection attempts in query parameters', async () => {
      const response = await request(app)
        .get('/api/auth/profile/audit-history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ eventType: "'; DROP TABLE auditlogs; --" })

      // Should either fail validation or sanitize
      expect([200, 400]).toContain(response.status)
      if (response.status === 200) {
        // Should not execute SQL
        expect(response.body.logs).toBeDefined()
      }
    })
  })

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    it('should prevent XSS in profile fields', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload=alert("XSS")>',
      ]

      for (const payload of xssPayloads) {
        const response = await request(app)
          .patch('/api/auth/profile/name')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ firstName: payload, lastName: 'Test' })

        // Should either fail validation or sanitize
        expect([200, 400]).toContain(response.status)

        // If it succeeds, verify payload is sanitized
        if (response.status === 200) {
          const user = await User.findById(businessOwner._id)
          expect(user.firstName).not.toContain('<script>')
          expect(user.firstName).not.toContain('javascript:')
          expect(user.firstName).not.toContain('onerror=')
        }
      }
    })

    it('should sanitize XSS in email field', async () => {
      const xssPayload = '<script>alert("XSS")</script>@example.com'
      const response = await request(app)
        .post('/api/auth/login/start')
        .send({ email: xssPayload, password: 'test' })

      // Should fail email validation
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.error).toBeDefined()
    })

    it('should prevent XSS in audit log metadata', async () => {
      // Create a profile update to generate audit log
      await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ firstName: 'Test', lastName: 'User' })

      // Verify audit logs don't contain XSS
      const auditLogs = await AuditLog.find({ userId: businessOwner._id }).limit(1).lean()
      if (auditLogs.length > 0) {
        const metadata = JSON.stringify(auditLogs[0].metadata || {})
        expect(metadata).not.toContain('<script>')
        expect(metadata).not.toContain('javascript:')
      }
    })
  })

  describe('CSRF (Cross-Site Request Forgery) Protection', () => {
    it('should require authentication for state-changing operations', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .send({ firstName: 'Test', lastName: 'User' })

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('unauthorized')
    })

    it('should validate JWT token for authenticated requests', async () => {
      const invalidToken = 'invalid.jwt.token'
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ firstName: 'Test', lastName: 'User' })

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('invalid_token')
    })

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', 'InvalidFormat token')
        .send({ firstName: 'Test', lastName: 'User' })

      expect(response.status).toBe(401)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('Permission Bypass Prevention', () => {
    let staffUser
    let staffToken
    let adminUser
    let adminToken

    beforeEach(async () => {
      const users = await createTestUsers()
      staffUser = users.staffUser
      adminUser = users.adminUser
      const tokens = getTestTokens(users)
      staffToken = tokens.staffToken
      adminToken = tokens.adminToken
    })

    it('should prevent staff from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${staffToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should prevent business owner from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should prevent unauthorized field updates', async () => {
      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          role: 'admin', // Restricted field
        })

      // Should fail or create admin alert
      expect([400, 403]).toContain(response.status)
    })

    it('should prevent token tampering', async () => {
      // Decode and modify token
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(businessOwnerToken)
      decoded.role = 'admin' // Try to escalate role
      const tamperedToken = jwt.sign(decoded, 'wrong-secret')

      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${tamperedToken}`)

      // Should fail due to invalid signature
      expect(response.status).toBe(401)
    })
  })

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
      ]

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/login/start')
          .send({ email, password: 'test' })

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.body.error).toBeDefined()
      }
    })

    it('should validate phone number format', async () => {
      const invalidPhones = [
        'abc123',
        '123',
        '123456789012345678', // Too long
        '<script>alert("XSS")</script>',
      ]

      for (const phone of invalidPhones) {
        const response = await request(app)
          .patch('/api/auth/profile/contact')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ phoneNumber: phone })

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('validation_error')
      }
    })

    it('should validate password strength', async () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumber!',
        'NoSpecial123',
      ]

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/change-password-authenticated')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({
            currentPassword: 'Test123!@#',
            newPassword: password,
          })

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('weak_password')
      }
    })
  })

  describe('Concurrency Tests', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login/start')
            .send({
              email: businessOwner.email,
              password: 'Test123!@#',
            })
        )
      }

      const responses = await Promise.all(promises)
      
      // All should either succeed or be rate limited
      responses.forEach((response) => {
        expect([200, 401, 429]).toContain(response.status)
      })
    })

    it('should handle concurrent profile updates', async () => {
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .patch('/api/auth/profile/contact')
            .set('Authorization', `Bearer ${businessOwnerToken}`)
            .send({
              phoneNumber: `555123456${i}`,
            })
        )
      }

      const responses = await Promise.all(promises)
      
      // All should either succeed or be rate limited
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status)
      })
    })

    it('should prevent race conditions in approval workflow', async () => {
      // Create approval request
      const createResponse = await request(app)
        .patch('/api/auth/profile/personal-info')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          firstName: 'RaceTest',
        })

      if (createResponse.status === 200 && createResponse.body.approval) {
        const approvalId = createResponse.body.approval.approvalId

        // Create second admin
        const admin2 = await User.create({
          role: (await require('../../services/auth-service/src/models/Role').findOne({ slug: 'admin' }))._id,
          firstName: 'Admin2',
          lastName: 'User',
          email: require('../helpers/fixtures').generateUniqueEmail('admin2'),
          phoneNumber: `__unset__${Date.now()}_admin2`,
          passwordHash: await require('bcryptjs').hash('Test123!@#', 10),
          termsAccepted: true,
          tokenVersion: 0,
        })
        await admin2.populate('role')
        const admin2Token = require('../../services/auth-service/src/middleware/auth').signAccessToken(admin2).token

        // Try simultaneous approvals
        const promises = [
          request(app)
            .post(`/api/admin/approvals/${approvalId}/approve`)
            .set('Authorization', `Bearer ${admin2Token}`)
            .send({ approved: true }),
          request(app)
            .post(`/api/admin/approvals/${approvalId}/approve`)
            .set('Authorization', `Bearer ${admin2Token}`)
            .send({ approved: true }),
        ]

        const responses = await Promise.all(promises)
        
        // Should handle gracefully (one may succeed, one may fail)
        responses.forEach((response) => {
          expect([200, 400, 409]).toContain(response.status)
        })
      }
    })
  })
})
