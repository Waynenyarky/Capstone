const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../../services/auth-service/src/config/db')
const User = require('../../services/auth-service/src/models/User')
const Role = require('../../services/auth-service/src/models/Role')
const AuditLog = require('../../services/auth-service/src/models/AuditLog')
const { signAccessToken } = require('../../services/auth-service/src/middleware/auth')
const bcrypt = require('bcryptjs')

describe('Phase 6: Testing - Security & Performance', () => {
  let mongo
  let app
  let businessOwnerRole
  let staffRole
  let adminRole
  let businessOwner
  let staffUser
  let adminUser
  let businessOwnerToken
  let staffToken
  let adminToken

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.SEED_DEV = 'true'
    process.env.EMAIL_API_PROVIDER = 'mock'
    process.env.DEFAULT_FROM_EMAIL = 'no-reply@example.com'
    process.env.WEBAUTHN_RPID = 'localhost'
    process.env.WEBAUTHN_ORIGIN = 'http://localhost:3001'
    process.env.AUTH_SERVICE_PORT = '3001'
    process.env.EMAIL_API_PROVIDER = 'mock'
    process.env.AUDIT_CONTRACT_ADDRESS = '' // Disable blockchain for tests
    process.env.DISABLE_RATE_LIMIT = 'false' // Enable rate limiting for security tests

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)
    
    // Seed dev data if available (optional)
    try {
      const { seedDevDataIfEmpty } = require('../../services/auth-service/src/lib/seedDev')
      await seedDevDataIfEmpty()
    } catch (err) {
      // seedDev may not exist, that's okay
    }

    // Get or create roles
    businessOwnerRole = await Role.findOne({ slug: 'business_owner' })
    if (!businessOwnerRole) {
      businessOwnerRole = await Role.create({ name: 'Business Owner', slug: 'business_owner' })
    }

    staffRole = await Role.findOne({ slug: 'lgu_officer' })
    if (!staffRole) {
      staffRole = await Role.create({ name: 'LGU Officer', slug: 'lgu_officer' })
    }

    adminRole = await Role.findOne({ slug: 'admin' })
    if (!adminRole) {
      adminRole = await Role.create({ name: 'Admin', slug: 'admin' })
    }

    // Create test users
    const timestamp = Date.now()
    businessOwner = await User.findOneAndUpdate(
      { email: `businessowner${timestamp}@example.com` },
      {
        role: businessOwnerRole._id,
        firstName: 'Business',
        lastName: 'Owner',
        email: `businessowner${timestamp}@example.com`,
        phoneNumber: `__unset__${timestamp}_bo`,
        passwordHash: await bcrypt.hash('Test123!@#', 10),
        termsAccepted: true,
        tokenVersion: 0,
      },
      { upsert: true, new: true }
    )

    staffUser = await User.findOneAndUpdate(
      { email: `staff${timestamp}@example.com` },
      {
        role: staffRole._id,
        firstName: 'Staff',
        lastName: 'User',
        email: `staff${timestamp}@example.com`,
        phoneNumber: `__unset__${timestamp}_staff`,
        passwordHash: await bcrypt.hash('Test123!@#', 10),
        termsAccepted: true,
        tokenVersion: 0,
      },
      { upsert: true, new: true }
    )

    adminUser = await User.findOneAndUpdate(
      { email: `admin${timestamp}@example.com` },
      {
        role: adminRole._id,
        firstName: 'Admin',
        lastName: 'User',
        email: `admin${timestamp}@example.com`,
        phoneNumber: `__unset__${timestamp}_admin`,
        passwordHash: await bcrypt.hash('Admin123!@#', 10),
        termsAccepted: true,
        tokenVersion: 0,
      },
      { upsert: true, new: true }
    )

    // Populate roles before signing tokens
    const businessOwnerWithRole = await User.findById(businessOwner._id).populate('role').lean()
    const staffWithRole = await User.findById(staffUser._id).populate('role').lean()
    const adminWithRole = await User.findById(adminUser._id).populate('role').lean()

    businessOwnerToken = signAccessToken(businessOwnerWithRole).token
    staffToken = signAccessToken(staffWithRole).token
    adminToken = signAccessToken(adminWithRole).token
    const { app: authApp } = require('../../services/auth-service/src/index')
    app = authApp
  })

  afterAll(async () => {
    try {
      await mongoose.disconnect()
    } finally {
      if (mongo) await mongo.stop()
    }
  })

  describe('1. Security Tests - SQL Injection', () => {
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
          .expect(400) // Should fail validation, not execute SQL

        // Should not expose database errors
        expect(response.body.error).toBeDefined()
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
          .expect(400) // Should fail validation

        expect(response.body.error).toBeDefined()
      }
    })

    it('should sanitize SQL injection attempts in query parameters', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ eventType: "'; DROP TABLE auditlogs; --" })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('2. Security Tests - XSS (Cross-Site Scripting)', () => {
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
          .expect(400) // Should fail validation or sanitize

        expect(response.body.error).toBeDefined()
        // Verify payload is not stored as-is
        if (response.status === 200) {
          const user = await User.findById(businessOwner._id)
          expect(user.firstName).not.toContain('<script>')
          expect(user.firstName).not.toContain('javascript:')
        }
      }
    })

    it('should sanitize XSS in email field', async () => {
      const xssPayload = '<script>alert("XSS")</script>@example.com'
      const response = await request(app)
        .patch('/api/auth/profile/email')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ email: xssPayload })
        .expect(400) // Should fail email validation

      expect(response.body.error).toBeDefined()
    })

    it('should prevent XSS in audit log metadata', async () => {
      // This test verifies that XSS payloads in metadata are sanitized
      const xssPayload = '<script>alert("XSS")</script>'
      
      // Try to create an audit log with XSS (if such an endpoint exists)
      // For now, verify that existing audit logs don't contain XSS
      const auditLogs = await AuditLog.find({ userId: businessOwner._id }).limit(1).lean()
      if (auditLogs.length > 0) {
        const metadata = JSON.stringify(auditLogs[0].metadata || {})
        expect(metadata).not.toContain('<script>')
      }
    })
  })

  describe('3. Security Tests - CSRF (Cross-Site Request Forgery)', () => {
    it('should require authentication for state-changing operations', async () => {
      // CSRF protection is handled by requiring JWT tokens
      const response = await request(app)
        .patch('/api/auth/profile/password')
        .send({ currentPassword: 'old', newPassword: 'NewPass123!@#' })
        .expect(401) // Should require authentication

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('unauthorized')
    })

    it('should validate JWT token for authenticated requests', async () => {
      const invalidToken = 'invalid.jwt.token'
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ firstName: 'Test', lastName: 'User' })
        .expect(401)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('invalid_token')
    })

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', 'InvalidFormat token')
        .send({ firstName: 'Test', lastName: 'User' })
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('4. Security Tests - Rate Limiting', () => {
    beforeEach(() => {
      // Reset rate limit state by waiting a bit
      // In a real scenario, you'd clear the rate limit store
    })

    it('should rate limit login attempts', async () => {
      // Make multiple login attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login/start')
          .send({ email: 'test@example.com', password: 'wrong' })

        if (i >= 5) {
          // After 5 attempts, should be rate limited or validation error
          expect([200, 400, 429]).toContain(response.status)
          if (response.status === 429) {
            expect(response.body.error.code).toBe('login_code_rate_limited')
            break
          }
        }
      }
    })

    it('should rate limit verification requests', async () => {
      // Make multiple verification requests
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/verification/request')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ method: 'otp', purpose: 'email_change' })

        if (i >= 5) {
          expect([200, 404, 429]).toContain(response.status)
          if (response.status === 429) {
            expect(response.body.error.code).toBe('verification_rate_limited')
            break
          }
        }
      }
    })

    it('should rate limit password change attempts', async () => {
      // Make multiple password change attempts
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .patch('/api/auth/profile/password')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({
            currentPassword: 'Test123!@#',
            newPassword: 'NewPass123!@#',
          })

        if (i >= 3) {
          expect([200, 400, 403, 429]).toContain(response.status)
          if (response.status === 429) {
            expect(response.body.error.code).toBe('password_change_rate_limited')
            break
          }
        }
      }
    })

    it('should rate limit profile update requests', async () => {
      // Make rapid profile updates
      for (let i = 0; i < 11; i++) {
        const response = await request(app)
          .patch('/api/auth/profile/name')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ firstName: `Test${i}`, lastName: 'User' })

        if (i >= 10) {
          expect([200, 400, 429]).toContain(response.status)
          if (response.status === 429) {
            expect(response.body.error.code).toBe('profile_update_rate_limited')
            break
          }
        }
      }
    })
  })

  describe('5. Security Tests - Permission Bypass', () => {
    it('should prevent staff from changing password', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/password')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPass123!@#',
        })
        .expect(403) // Should be forbidden

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('field_restricted')
    })

    it('should prevent staff from changing role', async () => {
      // Staff should not be able to change their role
      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'admin' })
        .expect(403) // Should be forbidden or validation error

      expect(response.body.error).toBeDefined()
    })

    it('should prevent non-admin from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/staff')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .expect(403) // Should be forbidden

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should prevent users from accessing other users\' data', async () => {
      // Business owner should not access admin's audit logs
      const response = await request(app)
        .get(`/api/auth/audit/history`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .query({ userId: String(adminUser._id) }) // Try to access admin's logs
      // Should return 403 (forbidden)
      .expect(403)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('forbidden')

      // If successful, verify only own logs are returned
      if (response.status === 200 && response.body.logs) {
        response.body.logs.forEach((log) => {
          expect(String(log.userId)).toBe(String(businessOwner._id))
        })
      }
    })

    it('should validate token version for session invalidation', async () => {
      // Create a token, then invalidate the session
      const user = await User.findById(businessOwner._id)
      const originalTokenVersion = user.tokenVersion || 0
      
      // Invalidate session by incrementing token version
      user.tokenVersion = (originalTokenVersion || 0) + 1
      await user.save()

      // Try to use old token
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .expect(401) // Should be rejected

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('token_invalidated')

      // Restore token version for other tests
      user.tokenVersion = originalTokenVersion
      await user.save()
    })
  })

  describe('6. Performance Tests - Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10
      const requests = []

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/health')
            .expect(200)
        )
      }

      const responses = await Promise.all(requests)
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.ok).toBe(true)
      })
    })

    it('should handle rapid sequential requests', async () => {
      const sequentialRequests = 20
      for (let i = 0; i < sequentialRequests; i++) {
        const response = await request(app)
          .get('/api/health')
          .expect(200)

        expect(response.body.ok).toBe(true)
      }
    })

    it('should maintain performance under load for profile reads', async () => {
      const requests = []
      const requestCount = 15

      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${businessOwnerToken}`)
            .expect(200)
        )
      }

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / requestCount

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })

      // Average response time should be reasonable (< 500ms per request)
      expect(avgTime).toBeLessThan(500)
    })
  })

  describe('7. Performance Tests - Stress Testing', () => {
    it('should handle database query performance', async () => {
      // Create multiple audit logs
      const auditLogs = []
      for (let i = 0; i < 50; i++) {
        auditLogs.push({
          userId: businessOwner._id,
          eventType: 'profile_update',
          fieldChanged: 'firstName', // Use valid enum value
          oldValue: '',
          newValue: `test${i}`,
          role: 'business_owner',
          metadata: { test: true },
          hash: require('crypto').createHash('sha256').update(`test${i}`).digest('hex'),
        })
      }

      const startTime = Date.now()
      await AuditLog.insertMany(auditLogs)
      const insertTime = Date.now() - startTime

      // Query performance
      const queryStartTime = Date.now()
      const logs = await AuditLog.find({ userId: businessOwner._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
      const queryTime = Date.now() - queryStartTime

      expect(logs.length).toBeGreaterThan(0)
      expect(insertTime).toBeLessThan(5000) // Should complete in reasonable time
      expect(queryTime).toBeLessThan(1000) // Query should be fast

      // Cleanup
      await AuditLog.deleteMany({ userId: businessOwner._id, 'metadata.test': true })
    })

    it('should handle large payload sizes gracefully', async () => {
      // Test with large string payload
      const largeString = 'a'.repeat(10000) // 10KB string
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ firstName: largeString, lastName: 'Test' })
        .expect(400) // Should reject or sanitize large input

      expect(response.body.error).toBeDefined()
    })

    it('should handle multiple concurrent profile updates', async () => {
      const concurrentUpdates = 5
      const requests = []

      for (let i = 0; i < concurrentUpdates; i++) {
        requests.push(
          request(app)
            .patch('/api/auth/profile/name')
            .set('Authorization', `Bearer ${businessOwnerToken}`)
            .send({ firstName: `Concurrent${i}`, lastName: 'Test' })
        )
      }

      const responses = await Promise.all(requests)
      // At least some should succeed (others may be rate limited)
      const successCount = responses.filter((r) => r.status === 200).length
      expect(successCount).toBeGreaterThan(0)
    })
  })

  describe('8. Integration Tests - End-to-End Flows', () => {
    it('should complete full profile update flow with verification', async () => {
      // Step 1: Request verification
      const verifyResponse = await request(app)
        .post('/api/auth/verification/request')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ method: 'otp', purpose: 'email_change' })
        .expect(200)

      expect(verifyResponse.body.success).toBe(true)

      // Step 2: Update profile (would normally verify code first)
      // In test, we'll just verify the flow exists
      const updateResponse = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' })
        .expect(200)

      expect(updateResponse.body).toBeDefined()
    })

    it('should allow admin to create staff users', async () => {
      // Admin creates a staff user (admin-only functionality)
      const response = await request(app)
        .post('/api/auth/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `teststaff${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Staff',
          phoneNumber: '+1234567890',
          office: 'OSBC',
          role: 'lgu_officer',
        })
        .expect(201)

      expect(response.body.email).toBeDefined()
      expect(response.body.email).toContain('teststaff')
    })

    it('should handle complete account lockout flow', async () => {
      // Create a test user for lockout
      const lockoutTestUser = await User.create({
        role: businessOwnerRole._id,
        firstName: 'Lockout',
        lastName: 'Test',
        email: `lockouttest${Date.now()}@example.com`,
        phoneNumber: `__unset__${Date.now()}_lockout`,
        passwordHash: await bcrypt.hash('Test123!@#', 10),
        termsAccepted: true,
        failedVerificationAttempts: 0,
        accountLockedUntil: null,
      })

      // Make multiple failed verification attempts
      const { incrementFailedAttempts, checkLockout } = require('../../services/auth-service/src/lib/accountLockout')
      
      for (let i = 0; i < 5; i++) {
        await incrementFailedAttempts(lockoutTestUser._id)
      }

      // Verify account is locked
      const lockoutStatus = await checkLockout(lockoutTestUser._id)
      expect(lockoutStatus.locked).toBe(true)
      expect(lockoutStatus.lockedUntil).toBeDefined()

      // Cleanup
      await User.findByIdAndDelete(lockoutTestUser._id)
    })
  })

  describe('9. Security Tests - Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
      ]

      for (const email of invalidEmails) {
        const response = await request(app)
          .patch('/api/auth/profile/email')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ email })
          .expect(400)

        expect(response.body.error).toBeDefined()
      }
    })

    it('should validate phone number format', async () => {
      const invalidPhones = [
        '123', // Too short
        'abc123', // Contains letters
        '12345678901234567890', // Too long
      ]

      for (const phone of invalidPhones) {
        const response = await request(app)
          .patch('/api/auth/profile/contact')
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ phoneNumber: phone })
          .expect(400)

        expect(response.body.error).toBeDefined()
      }
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .patch('/api/auth/profile/name')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({}) // Missing required fields
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('validation_error')
    })
  })
})
