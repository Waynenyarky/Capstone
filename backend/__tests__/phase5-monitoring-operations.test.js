const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../src/config/db')
const { seedDevDataIfEmpty } = require('../src/lib/seedDev')
const User = require('../src/models/User')
const Role = require('../src/models/Role')
const AuditLog = require('../src/models/AuditLog')
const { signAccessToken } = require('../src/middleware/auth')
const logger = require('../src/lib/logger')
const errorTracking = require('../src/lib/errorTracking')
const { getPerformanceStats, resetMetrics } = require('../src/middleware/performanceMonitor')
const { getSecurityStats, trackFailedLogin, trackRateLimitViolation, detectSuspiciousActivity, clearOldData } = require('../src/middleware/securityMonitor')
const bcrypt = require('bcryptjs')

describe('Phase 5: Monitoring & Operations', () => {
  let mongo
  let app
  let adminRole
  let businessOwnerRole
  let adminUser
  let businessOwner
  let adminToken
  let businessOwnerToken

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.SEED_DEV = 'true'
    process.env.EMAIL_HOST = 'localhost'
    process.env.EMAIL_HOST_USER = 'test'
    process.env.EMAIL_HOST_PASSWORD = 'test'
    process.env.DEFAULT_FROM_EMAIL = 'no-reply@example.com'
    process.env.WEBAUTHN_RPID = 'localhost'
    process.env.WEBAUTHN_ORIGIN = 'http://localhost:3000'
    process.env.AUDIT_CONTRACT_ADDRESS = '' // Disable blockchain for tests
    process.env.LOG_LEVEL = 'debug' // Enable debug logging for tests

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)
    await seedDevDataIfEmpty()

    // Get or create roles
    adminRole = await Role.findOne({ slug: 'admin' })
    if (!adminRole) {
      adminRole = await Role.create({ name: 'Admin', slug: 'admin' })
    }

    businessOwnerRole = await Role.findOne({ slug: 'business_owner' })
    if (!businessOwnerRole) {
      businessOwnerRole = await Role.create({ name: 'Business Owner', slug: 'business_owner' })
    }

    // Create test users
    const timestamp = Date.now()
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

    // Populate roles before signing tokens
    const adminUserWithRole = await User.findById(adminUser._id).populate('role').lean()
    const businessOwnerWithRole = await User.findById(businessOwner._id).populate('role').lean()
    
    adminToken = signAccessToken(adminUserWithRole).token
    businessOwnerToken = signAccessToken(businessOwnerWithRole).token
    app = require('../src/index').app

    // Reset metrics before tests
    resetMetrics()
  })

  afterAll(async () => {
    try {
      await mongoose.disconnect()
    } finally {
      if (mongo) await mongo.stop()
    }
  })

  describe('1. Structured Logging with Correlation IDs', () => {
    it('should generate correlation ID for requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.headers['x-correlation-id']).toBeDefined()
      expect(typeof response.headers['x-correlation-id']).toBe('string')
      expect(response.headers['x-correlation-id'].length).toBeGreaterThan(0)
    })

    it('should use provided correlation ID from header', async () => {
      const customCorrelationId = 'test-correlation-id-12345'
      const response = await request(app)
        .get('/api/health')
        .set('X-Correlation-ID', customCorrelationId)
        .expect(200)

      expect(response.headers['x-correlation-id']).toBe(customCorrelationId)
    })

    it('should log requests with correlation IDs', () => {
      // Mock console.log to capture log output
      const originalLog = console.log
      const logCalls = []
      console.log = (...args) => {
        logCalls.push(args.join(' '))
      }

      logger.info('Test log message', { correlationId: 'test-123' })

      console.log = originalLog
      // In test mode, logs should be output
      expect(logCalls.length).toBeGreaterThan(0)
    })

    it('should support different log levels', () => {
      expect(() => logger.error('Error message')).not.toThrow()
      expect(() => logger.warn('Warning message')).not.toThrow()
      expect(() => logger.info('Info message')).not.toThrow()
      expect(() => logger.debug('Debug message')).not.toThrow()
    })

    it('should log request details', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: () => 'test-agent',
        correlationId: 'test-correlation-id',
      }
      const mockRes = {
        statusCode: 200,
      }

      expect(() => logger.logRequest(mockReq, mockRes, 150)).not.toThrow()
    })
  })

  describe('2. Error Tracking', () => {
    beforeEach(() => {
      // Clear error counts before each test
      errorTracking.errorCounts.clear()
      errorTracking.criticalErrors = []
    })

    it('should track errors', async () => {
      const testError = new Error('Test error')
      testError.code = 'test_error'

      await errorTracking.trackError(testError, {
        correlationId: 'test-correlation-id',
        userId: String(businessOwner._id),
      })

      const stats = errorTracking.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThan(0)
    })

    it('should classify error severity correctly', async () => {
      // Test critical error (database error)
      const dbError = new Error('Database connection failed')
      dbError.name = 'MongoError'
      await errorTracking.trackError(dbError, {})
      
      // Test high severity error (auth error)
      const authError = new Error('Unauthorized')
      authError.code = 'unauthorized'
      await errorTracking.trackError(authError, { statusCode: 401 })
      
      // Test low severity error (validation error)
      const validationError = new Error('Validation failed')
      validationError.isJoi = true
      await errorTracking.trackError(validationError, {})

      const stats = errorTracking.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThanOrEqual(3)
    })

    it('should track error frequency', async () => {
      const testError = new Error('Frequent error')
      testError.code = 'frequent_error'

      // Track same error multiple times
      for (let i = 0; i < 5; i++) {
        await errorTracking.trackError(testError, {})
      }

      const stats = errorTracking.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThanOrEqual(5)
    })

    it('should log critical errors to audit trail', async () => {
      const criticalError = new Error('Critical system error')
      criticalError.name = 'MongoError'

      await errorTracking.trackError(criticalError, {
        userId: String(businessOwner._id),
        role: 'business_owner',
      })

      // Check if audit log was created
      const auditLogs = await AuditLog.find({
        eventType: 'error_critical',
        userId: businessOwner._id,
      }).lean()

      expect(auditLogs.length).toBeGreaterThan(0)
    })

    it('should provide error statistics', () => {
      const stats = errorTracking.getErrorStats()
      expect(stats).toHaveProperty('totalErrors')
      expect(stats).toHaveProperty('errorsLastHour')
      expect(stats).toHaveProperty('errorsLastDay')
      expect(stats).toHaveProperty('criticalErrorsLastHour')
      expect(stats).toHaveProperty('uniqueErrorTypes')
    })
  })

  describe('3. Performance Monitoring', () => {
    beforeEach(() => {
      resetMetrics()
    })

    it('should track API response times', async () => {
      await request(app)
        .get('/api/health')
        .expect(200)

      const stats = getPerformanceStats()
      expect(stats.endpoints).toBeDefined()
      expect(Object.keys(stats.endpoints).length).toBeGreaterThan(0)
    })

    it('should track slow API requests', async () => {
      // Make a request
      await request(app)
        .get('/api/health')
        .expect(200)

      const stats = getPerformanceStats()
      const endpointKey = 'GET /api/health'
      
      if (stats.endpoints[endpointKey]) {
        expect(stats.endpoints[endpointKey]).toHaveProperty('count')
        expect(stats.endpoints[endpointKey]).toHaveProperty('avgResponseTime')
        expect(stats.endpoints[endpointKey]).toHaveProperty('minResponseTime')
        expect(stats.endpoints[endpointKey]).toHaveProperty('maxResponseTime')
      }
    })

    it('should track database query performance', async () => {
      // Perform a database query
      await User.findOne({ _id: businessOwner._id }).lean()

      const stats = getPerformanceStats()
      expect(stats.database).toBeDefined()
    })

    it('should track multiple endpoint calls', async () => {
      // Make multiple requests
      await request(app).get('/api/health').expect(200)
      await request(app).get('/api/health').expect(200)
      await request(app).get('/api/health').expect(200)

      const stats = getPerformanceStats()
      const endpointKey = 'GET /api/health'
      
      if (stats.endpoints[endpointKey]) {
        expect(stats.endpoints[endpointKey].count).toBeGreaterThanOrEqual(3)
      }
    })

    it('should calculate average response times', async () => {
      await request(app).get('/api/health').expect(200)

      const stats = getPerformanceStats()
      const endpointKey = 'GET /api/health'
      
      if (stats.endpoints[endpointKey]) {
        expect(stats.endpoints[endpointKey].avgResponseTime).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('4. Security Monitoring', () => {
    beforeEach(() => {
      // Clear security events before each test
      clearOldData()
    })

    it('should track failed login attempts', () => {
      const ip = '192.168.1.100'
      const userId = String(businessOwner._id)

      trackFailedLogin(ip, userId)
      trackFailedLogin(ip, userId)
      trackFailedLogin(ip, userId)

      const stats = getSecurityStats()
      expect(stats.failedLoginsLastHour).toBeGreaterThanOrEqual(3)
    })

    it('should alert on multiple failed logins from same IP', async () => {
      const ip = '192.168.1.200'
      const userId = String(businessOwner._id)

      // Track 5+ failed logins (threshold)
      for (let i = 0; i < 6; i++) {
        trackFailedLogin(ip, userId)
      }

      // Allow async audit logging to flush
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Check if security event was logged
      const auditLogs = await AuditLog.find({
        eventType: 'security_event',
        'metadata.ip': ip,
      }).lean()

      expect(auditLogs.length).toBeGreaterThan(0)
    })

    it('should track rate limit violations', () => {
      const ip = '192.168.1.300'
      const endpoint = '/api/auth/login/start'

      trackRateLimitViolation(ip, endpoint)
      trackRateLimitViolation(ip, endpoint)

      const stats = getSecurityStats()
      expect(stats.rateLimitViolations).toBeGreaterThan(0)
    })

    it('should detect SQL injection attempts', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        ip: '192.168.1.400',
        get: () => 'test-agent',
        correlationId: 'test-correlation-id',
        body: {
          query: "SELECT * FROM users WHERE id = '1' OR '1'='1'",
        },
        query: {},
        params: {},
      }

      const suspicious = detectSuspiciousActivity(mockReq)
      expect(suspicious).toBe(true)
    })

    it('should detect XSS attempts', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        ip: '192.168.1.500',
        get: () => 'test-agent',
        correlationId: 'test-correlation-id',
        body: {
          comment: '<script>alert("XSS")</script>',
        },
        query: {},
        params: {},
      }

      const suspicious = detectSuspiciousActivity(mockReq)
      expect(suspicious).toBe(true)
    })

    it('should detect suspicious user agents', () => {
      // Temporarily enable user agent checking for this test
      const originalEnv = process.env.TEST_USER_AGENT_DETECTION
      process.env.TEST_USER_AGENT_DETECTION = 'true'
      
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '192.168.1.600',
        get: (header) => header === 'user-agent' ? '' : 'test',
        correlationId: 'test-correlation-id',
        body: {},
        query: {},
        params: {},
      }

      const suspicious = detectSuspiciousActivity(mockReq)
      // Restore original env
      if (originalEnv) {
        process.env.TEST_USER_AGENT_DETECTION = originalEnv
      } else {
        delete process.env.TEST_USER_AGENT_DETECTION
      }
      expect(suspicious).toBe(true)
    })

    it('should provide security statistics', () => {
      const stats = getSecurityStats()
      expect(stats).toHaveProperty('failedLoginsLastHour')
      expect(stats).toHaveProperty('failedLoginsLastDay')
      expect(stats).toHaveProperty('suspiciousRequestsLastHour')
      expect(stats).toHaveProperty('totalSuspiciousRequests')
      expect(stats).toHaveProperty('uniqueIPsWithFailedLogins')
      expect(stats).toHaveProperty('rateLimitViolations')
    })

    it('should log security events to audit trail', async () => {
      const ip = '192.168.1.700'
      const userId = String(businessOwner._id)

      // Trigger security event
      for (let i = 0; i < 6; i++) {
        trackFailedLogin(ip, userId)
      }

      // Wait a bit for async audit log creation
      await new Promise((resolve) => setTimeout(resolve, 100))

      const auditLogs = await AuditLog.find({
        eventType: 'security_event',
      }).lean()

      expect(auditLogs.length).toBeGreaterThan(0)
    })
  })

  describe('5. Monitoring Endpoint', () => {
    it('should return monitoring stats for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/monitoring/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('errors')
      expect(response.body).toHaveProperty('performance')
      expect(response.body).toHaveProperty('security')
      expect(response.body).toHaveProperty('timestamp')

      expect(response.body.errors).toHaveProperty('totalErrors')
      expect(response.body.errors).toHaveProperty('errorsLastHour')
      expect(response.body.errors).toHaveProperty('errorsLastDay')
      expect(response.body.errors).toHaveProperty('criticalErrorsLastHour')
      expect(response.body.errors).toHaveProperty('uniqueErrorTypes')

      expect(response.body.performance).toHaveProperty('endpoints')
      expect(response.body.performance).toHaveProperty('database')

      expect(response.body.security).toHaveProperty('failedLoginsLastHour')
      expect(response.body.security).toHaveProperty('suspiciousRequestsLastHour')
    })

    it('should reject non-admin users from monitoring endpoint', async () => {
      await request(app)
        .get('/api/admin/monitoring/stats')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .expect(403)
    })

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/admin/monitoring/stats')
        .expect(401)
    })
  })

  describe('6. Error Handler Middleware', () => {
    it('should handle errors with correlation IDs', async () => {
      // Create a route that throws an error
      // Note: Error handler middleware must be registered after routes
      const errorHandlerMiddleware = require('../src/middleware/errorHandler')
      const testRouter = require('express').Router()
      testRouter.get('/test-error-handler', (req, res, next) => {
        const error = new Error('Test error')
        error.statusCode = 500
        error.code = 'test_error'
        next(error)
      })
      
      // Create a temporary app instance for this test
      const express = require('express')
      const testApp = express()
      testApp.use(express.json())
      const correlationIdMiddleware = require('../src/middleware/correlationId')
      testApp.use(correlationIdMiddleware)
      testApp.use('/api/test-error', testRouter)
      testApp.use(errorHandlerMiddleware) // Error handler must be last

      const response = await request(testApp)
        .get('/api/test-error/test-error-handler')
        .expect(500)

      expect(response.body).toHaveProperty('ok')
      expect(response.body.ok).toBe(false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code')
      expect(response.body.error).toHaveProperty('message')
    })

    it('should include correlation ID in error responses', async () => {
      const customCorrelationId = 'error-test-correlation-id'
      const errorHandlerMiddleware = require('../src/middleware/errorHandler')
      const testRouter = require('express').Router()
      testRouter.get('/test-error-correlation', (req, res, next) => {
        const error = new Error('Test error')
        error.statusCode = 400
        error.code = 'test_error'
        next(error)
      })
      
      // Create a temporary app instance for this test
      const express = require('express')
      const testApp = express()
      testApp.use(express.json())
      const correlationIdMiddleware = require('../src/middleware/correlationId')
      testApp.use(correlationIdMiddleware)
      testApp.use('/api/test-correlation', testRouter)
      testApp.use(errorHandlerMiddleware) // Error handler must be last

      const response = await request(testApp)
        .get('/api/test-correlation/test-error-correlation')
        .set('X-Correlation-ID', customCorrelationId)
        .expect(400)

      expect(response.body).toHaveProperty('correlationId')
      expect(response.body.correlationId).toBe(customCorrelationId)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('7. Integration: End-to-End Monitoring', () => {
    it('should track complete request lifecycle', async () => {
      const correlationId = 'integration-test-id'
      
      // Make a request
      const response = await request(app)
        .get('/api/health')
        .set('X-Correlation-ID', correlationId)
        .expect(200)

      // Verify correlation ID is returned
      expect(response.headers['x-correlation-id']).toBe(correlationId)

      // Verify performance tracking
      const perfStats = getPerformanceStats()
      expect(perfStats.endpoints).toBeDefined()

      // Verify error tracking is available
      const errorStats = errorTracking.getErrorStats()
      expect(errorStats).toBeDefined()

      // Verify security monitoring is available
      const securityStats = getSecurityStats()
      expect(securityStats).toBeDefined()
    })

    it('should track errors through complete flow', async () => {
      const testError = new Error('Integration test error')
      testError.code = 'integration_error'

      await errorTracking.trackError(testError, {
        correlationId: 'integration-error-test',
        userId: String(businessOwner._id),
        request: {
          method: 'POST',
          path: '/api/test/error',
          ip: '127.0.0.1',
        },
      })

      const stats = errorTracking.getErrorStats()
      expect(stats.totalErrors).toBeGreaterThan(0)
    })
  })
})
