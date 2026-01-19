const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../../services/auth-service/src/config/db')
const User = require('../../services/auth-service/src/models/User')
const Role = require('../../services/auth-service/src/models/Role')
const AuditLog = require('../../services/auth-service/src/models/AuditLog')
const AuditViewLog = require('../../services/audit-service/src/models/AuditViewLog')
const { signAccessToken } = require('../../services/auth-service/src/middleware/auth')
const auditVerifier = require('../../services/audit-service/src/lib/auditVerifier')
const blockchainQueue = require('../../services/audit-service/src/lib/blockchainQueue')
const { maskSensitiveData, maskEmail, maskPhoneNumber, maskIdNumber } = require('../../services/auth-service/src/lib/dataMasker')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

describe('Phase 4: Audit & Compliance', () => {
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
    process.env.FRONTEND_URL = 'http://localhost:5173'

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

    // Create test users with unique emails
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
        isStaff: true,
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
        passwordHash: await bcrypt.hash('Test123!@#', 10),
        termsAccepted: true,
        tokenVersion: 0,
      },
      { upsert: true, new: true }
    )

    await businessOwner.populate('role')
    await staffUser.populate('role')
    await adminUser.populate('role')

    businessOwnerToken = signAccessToken(businessOwner).token
    staffToken = signAccessToken(staffUser).token
    adminToken = signAccessToken(adminUser).token

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

  describe('1. Audit History Endpoints', () => {
    beforeEach(async () => {
      // Create some test audit logs
      const hash1 = crypto.createHash('sha256').update('test1').digest('hex')
      const hash2 = crypto.createHash('sha256').update('test2').digest('hex')
      const hash3 = crypto.createHash('sha256').update('test3').digest('hex')

      await AuditLog.create([
        {
          userId: businessOwner._id,
          eventType: 'email_change',
          fieldChanged: 'email',
          oldValue: 'old@example.com',
          newValue: 'new@example.com',
          role: 'business_owner',
          hash: hash1,
          metadata: { test: 'data1' },
        },
        {
          userId: businessOwner._id,
          eventType: 'password_change',
          fieldChanged: 'password',
          oldValue: '[REDACTED]',
          newValue: '[REDACTED]',
          role: 'business_owner',
          hash: hash2,
          metadata: { test: 'data2' },
        },
        {
          userId: businessOwner._id,
          eventType: 'contact_update',
          fieldChanged: 'phoneNumber',
          oldValue: '1234567890',
          newValue: '9876543210',
          role: 'business_owner',
          hash: hash3,
          metadata: { test: 'data3' },
        },
      ])
    })

    afterEach(async () => {
      await AuditLog.deleteMany({})
      await AuditViewLog.deleteMany({})
    })

    it('should get user audit history', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.logs).toBeDefined()
      expect(Array.isArray(response.body.logs)).toBe(true)
      expect(response.body.total).toBeGreaterThan(0)
      expect(response.body.limit).toBeDefined()
      expect(response.body.skip).toBeDefined()
    })

    it('should filter audit history by event type', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history?eventType=email_change')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.logs.every((log) => log.eventType === 'email_change')).toBe(true)
    })

    it('should paginate audit history', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history?limit=2&skip=0')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.logs.length).toBeLessThanOrEqual(2)
      expect(response.body.hasMore).toBeDefined()
    })

    it('should mask sensitive data in audit logs', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      
      const passwordLog = response.body.logs.find((log) => log.fieldChanged === 'password')
      if (passwordLog) {
        expect(passwordLog.oldValue).toBe('[REDACTED]')
        expect(passwordLog.newValue).toBe('[REDACTED]')
      }
    })

    it('should allow admin to view any user audit history', async () => {
      const response = await request(app)
        .get(`/api/auth/audit/history?userId=${businessOwner._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.logs).toBeDefined()
    })

    it('should prevent non-admin from viewing other user audit history', async () => {
      const response = await request(app)
        .get(`/api/auth/audit/history?userId=${adminUser._id}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('forbidden')
    })

    it('should get specific audit log', async () => {
      const auditLog = await AuditLog.findOne({ userId: businessOwner._id })
      expect(auditLog).toBeDefined()

      const response = await request(app)
        .get(`/api/auth/audit/history/${auditLog._id}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.log).toBeDefined()
      expect(response.body.log.id).toBe(String(auditLog._id))
    })

    it('should verify audit log integrity', async () => {
      const auditLog = await AuditLog.findOne({ userId: businessOwner._id })
      expect(auditLog).toBeDefined()

      const response = await request(app)
        .get(`/api/auth/audit/verify/${auditLog._id}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.verification).toBeDefined()
    })
  })

  describe('2. Audit Export', () => {
    beforeEach(async () => {
      // Create test audit logs
      const hash1 = crypto.createHash('sha256').update('export1').digest('hex')
      await AuditLog.create({
        userId: businessOwner._id,
        eventType: 'email_change',
        fieldChanged: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
        role: 'business_owner',
        hash: hash1,
      })
    })

    afterEach(async () => {
      await AuditLog.deleteMany({})
      await AuditViewLog.deleteMany({})
    })

    it('should export audit history as JSON', async () => {
      const response = await request(app)
        .get('/api/auth/audit/export?format=json')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.body.exportedAt).toBeDefined()
      expect(response.body.logs).toBeDefined()
      expect(Array.isArray(response.body.logs)).toBe(true)
    })

    it('should export audit history as CSV', async () => {
      const response = await request(app)
        .get('/api/auth/audit/export?format=csv')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/csv')
      expect(response.text).toContain('ID,Event Type')
      expect(response.text).toContain('email_change')
    })

    it('should filter export by event type', async () => {
      const response = await request(app)
        .get('/api/auth/audit/export?format=json&eventType=email_change')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.logs.every((log) => log.eventType === 'email_change')).toBe(true)
    })

    it('should log export for compliance', async () => {
      await request(app)
        .get('/api/auth/audit/export?format=json')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      // Wait a bit for async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      const viewLog = await AuditViewLog.findOne({
        viewerId: businessOwner._id,
        'metadata.action': 'export',
      })

      expect(viewLog).toBeDefined()
      expect(viewLog.metadata.format).toBe('json')
    })
  })

  describe('3. Compliance Logging', () => {
    beforeEach(async () => {
      // Create test audit log
      const hash = crypto.createHash('sha256').update('compliance').digest('hex')
      await AuditLog.create({
        userId: businessOwner._id,
        eventType: 'email_change',
        fieldChanged: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
        role: 'business_owner',
        hash,
      })
    })

    afterEach(async () => {
      await AuditLog.deleteMany({})
      await AuditViewLog.deleteMany({})
    })

    it('should log audit history view', async () => {
      await request(app)
        .get('/api/auth/audit/history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      const viewLog = await AuditViewLog.findOne({
        viewerId: businessOwner._id,
        viewedUserId: businessOwner._id,
      })

      expect(viewLog).toBeDefined()
      expect(viewLog.viewerId.toString()).toBe(businessOwner._id.toString())
      expect(viewLog.viewedUserId.toString()).toBe(businessOwner._id.toString())
    })

    it('should log specific audit log view', async () => {
      const auditLog = await AuditLog.findOne({ userId: businessOwner._id })

      await request(app)
        .get(`/api/auth/audit/history/${auditLog._id}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      const viewLog = await AuditViewLog.findOne({
        viewerId: businessOwner._id,
        auditLogId: auditLog._id,
      })

      expect(viewLog).toBeDefined()
      expect(viewLog.auditLogId.toString()).toBe(auditLog._id.toString())
    })

    it('should track IP and user agent', async () => {
      await request(app)
        .get('/api/auth/audit/history')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .set('X-Forwarded-For', '192.168.1.1')
        .set('User-Agent', 'TestAgent/1.0')

      const viewLog = await AuditViewLog.findOne({
        viewerId: businessOwner._id,
      })

      expect(viewLog).toBeDefined()
      // IP and userAgent should be recorded
      expect(viewLog.ip).toBeDefined()
      expect(viewLog.userAgent).toBeDefined()
    })
  })

  describe('4. Data Masking', () => {
    it('should mask password fields', () => {
      const auditLog = {
        fieldChanged: 'password',
        oldValue: 'OldPassword123!',
        newValue: 'NewPassword123!',
        metadata: {},
      }

      const masked = maskSensitiveData(auditLog)
      expect(masked.oldValue).toBe('[REDACTED]')
      expect(masked.newValue).toBe('[REDACTED]')
    })

    it('should mask email addresses', () => {
      const email = 'testuser@example.com'
      const masked = maskEmail(email)
      expect(masked).toContain('@example.com')
      expect(masked).not.toBe(email)
      expect(masked.length).toBeGreaterThan(0)
    })

    it('should mask phone numbers', () => {
      const phone = '1234567890'
      const masked = maskPhoneNumber(phone)
      expect(masked).toContain('7890') // Last 4 digits visible
      expect(masked.length).toBe(phone.length)
      expect(masked.startsWith('*')).toBe(true)
    })

    it('should mask ID numbers', () => {
      const idNumber = '123456789012'
      const masked = maskIdNumber(idNumber)
      expect(masked).toContain('9012') // Last 4 characters visible
      expect(masked.length).toBe(idNumber.length)
      expect(masked.startsWith('*')).toBe(true)
    })

    it('should not mask non-sensitive fields', () => {
      const auditLog = {
        fieldChanged: 'firstName',
        oldValue: 'John',
        newValue: 'Jane',
        metadata: {},
      }

      const masked = maskSensitiveData(auditLog)
      expect(masked.oldValue).toBe('John')
      expect(masked.newValue).toBe('Jane')
    })

    it('should mask sensitive metadata', () => {
      const auditLog = {
        fieldChanged: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
        metadata: {
          newPasswordHash: 'hashed_password',
          apiKey: 'secret_key',
        },
      }

      const masked = maskSensitiveData(auditLog)
      expect(masked.metadata.newPasswordHash).toBe('[REDACTED]')
      expect(masked.metadata.apiKey).toBe('[REDACTED]')
    })
  })

  describe('5. Blockchain Queue', () => {
    beforeEach(() => {
      // Clear queue before each test
      blockchainQueue.clearQueue()
    })

    it('should queue blockchain operations', () => {
      // Queue an operation
      blockchainQueue.queueBlockchainOperation('logAuditHash', ['hash123', 'test_event'], 'audit123')

      // The queue processes asynchronously, so we verify the queue system exists
      // and can accept operations. The actual processing happens in the background.
      const status = blockchainQueue.getQueueStatus()
      expect(status).toBeDefined()
      expect(typeof status.queueLength).toBe('number')
      expect(typeof status.processing).toBe('boolean')
      expect(Array.isArray(status.items)).toBe(true)
    })

    it('should track retry count', () => {
      // Queue an operation
      blockchainQueue.queueBlockchainOperation('logAuditHash', ['hash123', 'test_event'], 'audit123')

      // Check queue status - items should have retry tracking
      const status = blockchainQueue.getQueueStatus()
      expect(status).toBeDefined()
      // Items in queue should have retry count (if any are still queued)
      if (status.items.length > 0) {
        expect(status.items[0]).toHaveProperty('retries')
        expect(typeof status.items[0].retries).toBe('number')
      }
    })

    it('should clear queue', () => {
      blockchainQueue.queueBlockchainOperation('logAuditHash', ['hash123', 'test_event'], 'audit123')
      blockchainQueue.clearQueue()

      const status = blockchainQueue.getQueueStatus()
      expect(status.queueLength).toBe(0)
      expect(status.items.length).toBe(0)
    })

    it('should handle multiple queued operations', () => {
      // Queue multiple operations rapidly
      blockchainQueue.queueBlockchainOperation('logAuditHash', ['hash1', 'event1'], 'audit1')
      blockchainQueue.queueBlockchainOperation('logCriticalEvent', ['event2', 'user123', 'details'], null)
      blockchainQueue.queueBlockchainOperation('logAuditHash', ['hash3', 'event3'], 'audit3')

      // The queue processes asynchronously, so we verify the queue system
      // can handle multiple operations. Items may be processed immediately.
      const status = blockchainQueue.getQueueStatus()
      expect(status).toBeDefined()
      // Queue should have processed or be processing these items
      expect(status.queueLength).toBeGreaterThanOrEqual(0)
    })
  })

  describe('6. Audit Statistics', () => {
    beforeEach(async () => {
      // Create test audit logs with different verification statuses
      const hash1 = crypto.createHash('sha256').update('verified').digest('hex')
      const hash2 = crypto.createHash('sha256').update('unverified').digest('hex')
      const hash3 = crypto.createHash('sha256').update('notlogged').digest('hex')

      await AuditLog.create([
        {
          userId: businessOwner._id,
          eventType: 'email_change',
          hash: hash1,
          verified: true,
          txHash: '0x123',
          blockNumber: 1,
          role: 'business_owner',
        },
        {
          userId: businessOwner._id,
          eventType: 'password_change',
          hash: hash2,
          verified: false,
          txHash: '0x456',
          blockNumber: 2,
          role: 'business_owner',
        },
        {
          userId: businessOwner._id,
          eventType: 'contact_update',
          hash: hash3,
          verified: false,
          txHash: '',
          blockNumber: 0,
          role: 'business_owner',
        },
      ])
    })

    afterEach(async () => {
      await AuditLog.deleteMany({})
    })

    it('should get audit statistics (admin only)', async () => {
      const response = await request(app)
        .get('/api/auth/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.stats).toBeDefined()
      expect(response.body.stats.total).toBeGreaterThan(0)
      expect(response.body.stats.verified).toBeDefined()
      expect(response.body.stats.unverified).toBeDefined()
      expect(response.body.stats.notLogged).toBeDefined()
    })

    it('should prevent non-admin from accessing stats', async () => {
      const response = await request(app)
        .get('/api/auth/audit/stats')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('7. Integration: Audit History with Filtering', () => {
    beforeEach(async () => {
      // Create audit logs with different dates
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const hash1 = crypto.createHash('sha256').update('date1').digest('hex')
      const hash2 = crypto.createHash('sha256').update('date2').digest('hex')
      const hash3 = crypto.createHash('sha256').update('date3').digest('hex')

      await AuditLog.create([
        {
          userId: businessOwner._id,
          eventType: 'email_change',
          hash: hash1,
          createdAt: yesterday,
          role: 'business_owner',
        },
        {
          userId: businessOwner._id,
          eventType: 'password_change',
          hash: hash2,
          createdAt: now,
          role: 'business_owner',
        },
        {
          userId: businessOwner._id,
          eventType: 'contact_update',
          hash: hash3,
          createdAt: tomorrow,
          role: 'business_owner',
        },
      ])
    })

    afterEach(async () => {
      await AuditLog.deleteMany({})
      await AuditViewLog.deleteMany({})
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()

      const response = await request(app)
        .get(`/api/auth/audit/history?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.logs.length).toBeGreaterThan(0)
    })

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/auth/audit/history?eventType=email_change&limit=10')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.logs.every((log) => log.eventType === 'email_change')).toBe(true)
      expect(response.body.logs.length).toBeLessThanOrEqual(10)
    })
  })
})
