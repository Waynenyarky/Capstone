const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../src/config/db')
const { seedDevDataIfEmpty } = require('../src/lib/seedDev')
const User = require('../src/models/User')
const Role = require('../src/models/Role')
const { signAccessToken } = require('../src/middleware/auth')
const { validatePasswordStrength } = require('../src/lib/passwordValidator')
const { checkPasswordHistory, addToPasswordHistory } = require('../src/lib/passwordHistory')
const { checkLockout, incrementFailedAttempts, clearFailedAttempts } = require('../src/lib/accountLockout')
const { sanitizeString, sanitizeEmail, sanitizePhoneNumber } = require('../src/lib/sanitizer')
const { validateImageFile } = require('../src/lib/fileValidator')

describe('Phase 1: Security Foundations', () => {
  let mongo
  let app
  let testUser
  let testToken

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
    // Disable blockchain for tests
    process.env.AUDIT_CONTRACT_ADDRESS = ''

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)
    await seedDevDataIfEmpty()

    // Create or get a test role (use business_owner as it exists in seed data)
    let userRole = await Role.findOne({ slug: 'business_owner' })
    if (!userRole) {
      // Fallback: create user role if business_owner doesn't exist
      userRole = await Role.create({ name: 'User', slug: 'user' })
    }
    
    testUser = await User.create({
      role: userRole._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phoneNumber: `__unset__${Date.now()}`, // Unique phone number
      passwordHash: await require('bcryptjs').hash('Test123!@#', 10),
      termsAccepted: true,
      tokenVersion: 0,
    })

    testToken = signAccessToken(testUser).token
    app = require('../src/index').app
  })

  afterAll(async () => {
    try {
      await mongoose.disconnect()
    } finally {
      if (mongo) await mongo.stop()
    }
  })

  describe('1. Password Strength Validation', () => {
    it('should accept a strong password', () => {
      const result = validatePasswordStrength('StrongPass123!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('12 characters'))).toBe(true)
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('uppercase'))).toBe(true)
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true)
    })

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumberPass!')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('number'))).toBe(true)
    })

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecial123')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('special'))).toBe(true)
    })

    it('should reject password longer than 200 characters', () => {
      const longPassword = 'A'.repeat(201) + '1!'
      const result = validatePasswordStrength(longPassword)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('200 characters'))).toBe(true)
    })
  })

  describe('2. Password History', () => {
    it('should detect password in history', async () => {
      const password = 'TestPassword123!'
      const history = []
      
      // Add password to history
      const hash1 = await require('bcryptjs').hash(password, 10)
      history.push(hash1)
      
      // Check if same password is in history
      const check = await checkPasswordHistory(password, history)
      expect(check.inHistory).toBe(true)
    })

    it('should not detect different password in history', async () => {
      const password1 = 'Password1!'
      const password2 = 'Password2!'
      const history = []
      
      // Add first password to history
      const hash1 = await require('bcryptjs').hash(password1, 10)
      history.push(hash1)
      
      // Check if different password is in history
      const check = await checkPasswordHistory(password2, history)
      expect(check.inHistory).toBe(false)
    })

    it('should maintain max 5 passwords in history', () => {
      const history = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6']
      const updated = addToPasswordHistory('hash7', history)
      expect(updated).toHaveLength(5)
      expect(updated).not.toContain('hash1')
      expect(updated).toContain('hash7')
    })
  })

  describe('3. Account Lockout', () => {
    let lockoutUser

    beforeEach(async () => {
      let userRole = await Role.findOne({ slug: 'business_owner' })
      if (!userRole) {
        userRole = await Role.create({ name: 'User', slug: 'user' })
      }
      lockoutUser = await User.create({
        role: userRole._id,
        firstName: 'Lockout',
        lastName: 'Test',
        email: 'lockout@example.com',
        phoneNumber: `__unset__${Date.now()}_lockout`, // Unique phone number
        passwordHash: await require('bcryptjs').hash('Test123!@#', 10),
        termsAccepted: true,
        failedVerificationAttempts: 0,
        accountLockedUntil: null,
      })
    })

    afterEach(async () => {
      if (lockoutUser) {
        await User.findByIdAndDelete(lockoutUser._id)
      }
    })

    it('should not be locked initially', async () => {
      const result = await checkLockout(lockoutUser._id)
      expect(result.locked).toBe(false)
    })

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await incrementFailedAttempts(lockoutUser._id)
      }

      const result = await checkLockout(lockoutUser._id)
      expect(result.locked).toBe(true)
      expect(result.lockedUntil).toBeDefined()
      expect(result.remainingMinutes).toBeGreaterThan(0)
    })

    it('should clear failed attempts on successful verification', async () => {
      await incrementFailedAttempts(lockoutUser._id)
      await clearFailedAttempts(lockoutUser._id)

      const user = await User.findById(lockoutUser._id)
      expect(user.failedVerificationAttempts).toBe(0)
      expect(user.accountLockedUntil).toBeNull()
    })
  })

  describe('4. Input Sanitization', () => {
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

  describe('5. File Upload Validation', () => {
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

  describe('6. Session Invalidation (Token Version)', () => {
    it('should include tokenVersion in JWT', () => {
      const user = {
        _id: '123',
        email: 'test@example.com',
        role: { slug: 'user' },
        tokenVersion: 5,
      }
      const { token } = signAccessToken(user)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(token)
      expect(decoded.tokenVersion).toBe(5)
    })

    it('should reject token with outdated tokenVersion', async () => {
      // Create user with tokenVersion = 0
      let userRole = await Role.findOne({ slug: 'business_owner' })
      if (!userRole) {
        userRole = await Role.create({ name: 'User', slug: 'user' })
      }
      const user = await User.create({
        role: userRole._id,
        firstName: 'Token',
        lastName: 'Test',
        email: 'tokentest@example.com',
        phoneNumber: `__unset__${Date.now()}_token`, // Unique phone number
        passwordHash: await require('bcryptjs').hash('Test123!@#', 10),
        termsAccepted: true,
        tokenVersion: 0,
      })

      // Sign token with version 0
      const token = signAccessToken(user).token

      // Increment user's tokenVersion (simulating password change)
      user.tokenVersion = 1
      await user.save()

      // Try to use old token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('token_invalidated')
    })
  })

  describe('7. Password Change Endpoint Integration', () => {
    let changePasswordUser
    let changePasswordToken

    beforeEach(async () => {
      let userRole = await Role.findOne({ slug: 'business_owner' })
      if (!userRole) {
        userRole = await Role.create({ name: 'User', slug: 'user' })
      }
      changePasswordUser = await User.create({
        role: userRole._id,
        firstName: 'Password',
        lastName: 'Change',
        email: 'passwordchange@example.com',
        phoneNumber: `__unset__${Date.now()}_password`, // Unique phone number
        passwordHash: await require('bcryptjs').hash('OldPass123!', 10),
        termsAccepted: true,
        tokenVersion: 0,
      })
      changePasswordToken = signAccessToken(changePasswordUser).token
    })

    afterEach(async () => {
      if (changePasswordUser) {
        await User.findByIdAndDelete(changePasswordUser._id)
      }
    })

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${changePasswordToken}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: 'weak', // Too weak - caught by Joi min(6) first
        })

      expect(response.status).toBe(400)
      // Joi validation catches it first with min(6), but our validator would catch it too
      // Test with a password that passes Joi but fails our validator
      const response2 = await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${changePasswordToken}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: 'weakpass', // Passes Joi min(6) but fails our strength check
        })

      expect(response2.status).toBe(400)
      expect(response2.body.error.code).toBe('weak_password')
    })

    it('should accept strong password and invalidate sessions', async () => {
      const response = await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${changePasswordToken}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: 'NewStrongPass123!',
        })

      expect(response.status).toBe(200)

      // Verify tokenVersion was incremented
      const updatedUser = await User.findById(changePasswordUser._id)
      expect(updatedUser.tokenVersion).toBe(1)

      // Verify old token is now invalid
      const tokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${changePasswordToken}`)

      expect(tokenResponse.status).toBe(401)
    })

    it('should require MFA re-enrollment after password change', async () => {
      const response = await request(app)
        .post('/api/auth/change-password-authenticated')
        .set('Authorization', `Bearer ${changePasswordToken}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: 'NewStrongPass123!',
        })

      expect(response.status).toBe(200)

      const updatedUser = await User.findById(changePasswordUser._id)
      expect(updatedUser.mfaReEnrollmentRequired).toBe(true)
      expect(updatedUser.mfaEnabled).toBe(false)
    })
  })
})
