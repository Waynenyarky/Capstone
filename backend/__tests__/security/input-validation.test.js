const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const { cleanupTestData } = require('../helpers/cleanup')
const { sanitizeString, sanitizeEmail, sanitizePhoneNumber } = require('../../services/auth-service/src/lib/sanitizer')
const { validateImageFile } = require('../../services/auth-service/src/lib/fileValidator')

describe('Input Validation Tests', () => {
  let mongo
  let app

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    app = setupApp()
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in strings', () => {
      const malicious = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeString(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('Hello')
    })

    it('should sanitize email addresses', () => {
      const email = '  TEST@EXAMPLE.COM  '
      const sanitized = sanitizeEmail(email)
      expect(sanitized).toBe('test@example.com')
    })

    it('should sanitize phone numbers', () => {
      const phone = '+1 (555) 123-4567<script>'
      const sanitized = sanitizePhoneNumber(phone)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toMatch(/[\d+\-() ]/)
    })

    it('should remove null bytes', () => {
      const input = 'Hello\0World'
      const sanitized = sanitizeString(input)
      expect(sanitized).not.toContain('\0')
    })
  })

  describe('File Upload Validation', () => {
    it('should accept valid JPEG file', async () => {
      // Create a mock JPEG file buffer (JPEG magic bytes: FF D8 FF)
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
      const file = {
        buffer: jpegBuffer,
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg',
      }

      const result = await validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid PNG file', async () => {
      // Create a mock PNG file buffer (PNG magic bytes)
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const file = {
        buffer: pngBuffer,
        mimetype: 'image/png',
        size: 2048,
        originalname: 'test.png',
      }

      const result = await validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject file exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
      const file = {
        buffer: largeBuffer,
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
        originalname: 'large.jpg',
      }

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    it('should reject disallowed file type', async () => {
      const file = {
        buffer: Buffer.from('fake content'),
        mimetype: 'application/exe',
        size: 1024,
        originalname: 'malware.exe',
      }

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })

    it('should reject file with mismatched content', async () => {
      const file = {
        buffer: Buffer.from('fake content'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'fake.jpg',
      }

      const result = await validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('does not match')
    })
  })
})
