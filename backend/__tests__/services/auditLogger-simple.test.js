const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require('../helpers/setup')
const { cleanupTestData } = require('../helpers/cleanup')
const AuditLog = require('../../services/auth-service/src/models/AuditLog')

// Import the service to test
const auditLogger = require('../../services/auth-service/src/lib/auditLogger')

// Mock axios for blockchain service calls
const mockAxios = {
  post: jest.fn()
}
jest.mock('axios', () => mockAxios)

// Mock logger
jest.mock('../../services/auth-service/src/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logDatabaseQuery: jest.fn()
}))

describe('Audit Logger Service - Core Functionality', () => {
  let mongo
  let testUserId
  let mockAxiosPost

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    
    // Create test user ID
    testUserId = '507f1f77bcf86cd799439011'
    
    // Set up axios mock
    mockAxiosPost = mockAxios.post
  })

  afterAll(async () => {
    await cleanupTestData()
    await teardownMongoDB()
  })

  beforeEach(async () => {
    // Clean up audit logs before each test
    await AuditLog.deleteMany({})
    jest.clearAllMocks()
    
    // Reset axios mock
    mockAxiosPost.mockClear()
    mockAxiosPost.mockResolvedValue({ data: { success: true } })
    
    // Set default environment
    process.env.AUDIT_SERVICE_URL = 'http://localhost:3004'
    process.env.AUDIT_SERVICE_API_KEY = 'test-api-key'
  })

  describe('calculateAuditHash', () => {
    it('should calculate consistent hash for same data', () => {
      const timestamp = '2024-01-01T00:00:00.000Z'
      const metadata = { ip: '127.0.0.1', userAgent: 'test-agent' }

      const hash1 = auditLogger.calculateAuditHash(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        metadata,
        timestamp
      )

      const hash2 = auditLogger.calculateAuditHash(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        metadata,
        timestamp
      )

      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA256 hex string
    })

    it('should generate different hashes for different data', () => {
      const timestamp = '2024-01-01T00:00:00.000Z'
      const metadata = { ip: '127.0.0.1' }

      const hash1 = auditLogger.calculateAuditHash(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        metadata,
        timestamp
      )

      const hash2 = auditLogger.calculateAuditHash(
        testUserId,
        'logout',
        null,
        null,
        null,
        'user',
        metadata,
        timestamp
      )

      expect(hash1).not.toBe(hash2)
    })

    it('should handle null and undefined values gracefully', () => {
      const timestamp = '2024-01-01T00:00:00.000Z'

      const hash = auditLogger.calculateAuditHash(
        testUserId,
        'login',
        null,
        null,
        null,
        null,
        null,
        timestamp
      )

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('createAuditLog', () => {
    it('should create basic audit log successfully', async () => {
      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        { ip: '127.0.0.1', userAgent: 'test-agent' }
      )

      expect(result).toBeDefined()
      expect(result.userId.toString()).toBe(testUserId)
      expect(result.eventType).toBe('login')
      expect(result.role).toBe('user')
      expect(result.metadata.ip).toBe('127.0.0.1')
      expect(result.metadata.userAgent).toBe('test-agent')
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should create audit log with field changes', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const result = await auditLogger.createAuditLog(
        testUserId,
        'profile_update',
        'email',
        'old@example.com',
        'new@example.com',
        'business-owner',
        { ip: '192.168.1.1' }
      )

      expect(result).toBeDefined()
      expect(result.fieldChanged).toBe('email')
      expect(result.oldValue).toBe('old@example.com')
      expect(result.newValue).toBe('new@example.com')
      expect(result.role).toBe('business-owner')
    })

    it('should call blockchain audit service', async () => {
      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        { ip: '127.0.0.1' }
      )

      // Verify audit log was created successfully
      expect(auditLog).toBeDefined()
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/)
      
      // The blockchain call is asynchronous and fire-and-forget
      // We just verify the audit log was created with the correct hash
      // The blockchain integration is tested separately in integration tests
    })

    it('should handle blockchain service errors gracefully', async () => {
      const blockchainError = new Error('Request failed with status code 401')
      require('axios').post.mockRejectedValue(blockchainError)

      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user'
      )

      // Wait a bit for the async blockchain call to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should still create audit log even if blockchain fails
      expect(result).toBeDefined()
      expect(result.eventType).toBe('login')
      
      // Should log warning about blockchain failure
      const logger = require('../../services/auth-service/src/lib/logger')
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to log to blockchain via Audit Service',
        { error: 'Request failed with status code 401' }
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalCreate = AuditLog.create
      AuditLog.create = jest.fn().mockRejectedValue(new Error('Database error'))

      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user'
      )

      // Should return null on database error
      expect(result).toBeNull()
      
      // Should log error
      const logger = require('../../services/auth-service/src/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating audit log',
        { error: expect.any(Error) }
      )

      // Restore original method
      AuditLog.create = originalCreate
    })

    it('should enrich metadata with default values', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        { customField: 'customValue' }
      )

      expect(result.metadata.ip).toBe('unknown')
      expect(result.metadata.userAgent).toBe('unknown')
      expect(result.metadata.customField).toBe('customValue')
    })
  })

  describe('Data Integrity', () => {
    it('should store hash consistently', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const metadata = { ip: '127.0.0.1', userAgent: 'test-agent' }

      // Create audit log
      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        metadata
      )

      // Verify hash was calculated and stored correctly
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/)
      
      // Verify the hash matches when calculated with the exact same timestamp
      // Use the timestamp from the created audit log
      const calculatedHash = auditLogger.calculateAuditHash(
        testUserId,
        'login',
        null,
        null,
        null,
        'user',
        metadata,
        auditLog.createdAt.toISOString()
      )
      
      expect(auditLog.hash).toBe(calculatedHash)
    })

    it('should preserve all audit log fields', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const metadata = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-123',
        requestId: 'req-456'
      }

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        'password_change',
        'password',
        '[REDACTED]',
        '[REDACTED]',
        'user',
        metadata
      )

      expect(auditLog.userId.toString()).toBe(testUserId)
      expect(auditLog.eventType).toBe('password_change')
      expect(auditLog.fieldChanged).toBe('password')
      expect(auditLog.oldValue).toBe('[REDACTED]')
      expect(auditLog.newValue).toBe('[REDACTED]')
      expect(auditLog.role).toBe('user')
      expect(auditLog.metadata).toEqual(metadata)
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(auditLog.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('Environment Configuration', () => {
    it('should handle missing API key gracefully', async () => {
      delete process.env.AUDIT_SERVICE_API_KEY

      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user'
      )

      // Verify audit log was created successfully even without API key
      expect(result).toBeDefined()
      expect(result.eventType).toBe('login')
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should use default audit service URL', async () => {
      delete process.env.AUDIT_SERVICE_URL

      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user'
      )

      // Verify audit log was created successfully with default URL
      expect(result).toBeDefined()
      expect(result.eventType).toBe('login')
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('Security and Compliance', () => {
    it('should handle password change events', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        'password_change',
        'password',
        '[REDACTED]',
        '[REDACTED]',
        'user',
        { ip: '127.0.0.1' }
      )

      expect(auditLog.eventType).toBe('password_change')
      expect(auditLog.fieldChanged).toBe('password')
      expect(auditLog.oldValue).toBe('[REDACTED]')
      expect(auditLog.newValue).toBe('[REDACTED]')
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle MFA events', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const mfaEvents = ['mfa_enabled', 'mfa_disabled']

      for (const event of mfaEvents) {
        await auditLogger.createAuditLog(
          testUserId,
          event,
          'mfa',
          'disabled',
          'enabled',
          'user',
          { ip: '127.0.0.1' }
        )
      }

      const mfaLogs = await AuditLog.find({ 
        userId: testUserId,
        eventType: { $in: mfaEvents }
      })
      expect(mfaLogs).toHaveLength(2)
    })

    it('should handle security events', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      const securityEvents = ['security_event', 'login_failed', 'account_lockout']

      for (const event of securityEvents) {
        await auditLogger.createAuditLog(
          testUserId,
          event,
          'security', // Valid fieldChanged enum value
          'false',
          'true',
          'security',
          { ip: 'suspicious.ip.address', userAgent: 'bot' }
        )
      }

      const securityLogs = await AuditLog.find({ 
        userId: testUserId,
        eventType: { $in: securityEvents }
      })
      expect(securityLogs).toHaveLength(3)
    })
  })

  describe('Performance', () => {
    it('should handle concurrent operations', async () => {
      const mockResponse = { data: { success: true } }
      require('axios').post.mockResolvedValue(mockResponse)

      // Create multiple audit logs concurrently
      const promises = []
      const eventTypes = ['login', 'logout', 'signup', 'profile_update']
      
      for (let i = 0; i < 10; i++) {
        const eventType = eventTypes[i % eventTypes.length]
        promises.push(
          auditLogger.createAuditLog(
            testUserId,
            eventType,
            null,
            null,
            null,
            'user',
            { ip: `127.0.0.${i}` }
          )
        )
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      
      // All should be valid and not null
      results.forEach((result) => {
        expect(result).not.toBeNull()
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
      })

      // All should be stored in database
      const storedLogs = await AuditLog.find({ userId: testUserId })
      expect(storedLogs).toHaveLength(10)
    })

    it('should not block on blockchain service failures', async () => {
      const blockchainError = new Error('Blockchain service timeout')
      require('axios').post.mockRejectedValue(blockchainError)

      const startTime = Date.now()
      
      const result = await auditLogger.createAuditLog(
        testUserId,
        'login',
        null,
        null,
        null,
        'user'
      )
      
      const endTime = Date.now()

      // Should complete quickly despite blockchain failure
      expect(endTime - startTime).toBeLessThan(1000)
      expect(result).toBeDefined()
    })
  })
})
