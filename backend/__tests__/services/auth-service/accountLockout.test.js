const {
  checkLockout,
  incrementFailedAttempts,
  clearFailedAttempts,
  unlockAccount,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} = require('../../../services/auth-service/src/lib/accountLockout')
const User = require('../../../services/auth-service/src/models/User')
const Role = require('../../../services/auth-service/src/models/Role')
const { setupTestEnvironment, setupMongoDB, teardownMongoDB } = require('../../helpers/setup')
const { cleanupTestData } = require('../../helpers/cleanup')
const bcrypt = require('bcryptjs')

describe('Auth Service - Account Lockout Library', () => {
  let mongo
  let testUser

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
    const role = await Role.findOne({ slug: 'business_owner' })
    if (!role) {
      await Role.create({ name: 'Business Owner', slug: 'business_owner' })
    }
    const businessOwnerRole = await Role.findOne({ slug: 'business_owner' })
    testUser = await User.create({
      email: `test${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash('Test123!@#', 10),
      role: businessOwnerRole._id,
      firstName: 'Test',
      lastName: 'User',
      termsAccepted: true,
      tokenVersion: 0,
    })
  })

  describe('checkLockout', () => {
    it('should return not locked for user with no lockout', async () => {
      const result = await checkLockout(testUser._id)
      expect(result.locked).toBe(false)
    })

    it('should return not locked for non-existent user', async () => {
      const result = await checkLockout('507f1f77bcf86cd799439011')
      expect(result.locked).toBe(false)
    })

    it('should return locked for user with active lockout', async () => {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      await User.findByIdAndUpdate(testUser._id, {
        accountLockedUntil: lockedUntil,
      })

      const result = await checkLockout(testUser._id)
      expect(result.locked).toBe(true)
      expect(result.lockedUntil).toBeDefined()
      expect(result.remainingMinutes).toBeGreaterThan(0)
    })

    it('should clear expired lockout and return not locked', async () => {
      const lockedUntil = new Date(Date.now() - 1000) // 1 second ago
      await User.findByIdAndUpdate(testUser._id, {
        accountLockedUntil: lockedUntil,
        failedVerificationAttempts: 5,
      })

      const result = await checkLockout(testUser._id)
      expect(result.locked).toBe(false)

      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser.accountLockedUntil).toBeNull()
      expect(updatedUser.failedVerificationAttempts).toBe(0)
    })
  })

  describe('incrementFailedAttempts', () => {
    it('should increment failed attempts from 0 to 1', async () => {
      const result = await incrementFailedAttempts(testUser._id)
      expect(result.locked).toBe(false)
      expect(result.attempts).toBe(1)

      const user = await User.findById(testUser._id)
      expect(user.failedVerificationAttempts).toBe(1)
    })

    it('should lock account after MAX_FAILED_ATTEMPTS', async () => {
      for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
        await incrementFailedAttempts(testUser._id)
      }

      const result = await incrementFailedAttempts(testUser._id)
      expect(result.locked).toBe(true)
      expect(result.attempts).toBe(MAX_FAILED_ATTEMPTS)
      expect(result.lockedUntil).toBeDefined()

      const user = await User.findById(testUser._id)
      expect(user.accountLockedUntil).toBeDefined()
    })

    it('should not increment if already locked', async () => {
      // Lock the account first
      for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
        await incrementFailedAttempts(testUser._id)
      }

      const result = await incrementFailedAttempts(testUser._id)
      expect(result.locked).toBe(true)
    })

    it('should return locked: false for non-existent user', async () => {
      const result = await incrementFailedAttempts('507f1f77bcf86cd799439011')
      expect(result.locked).toBe(false)
      expect(result.attempts).toBe(0)
    })
  })

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts and lockout', async () => {
      await User.findByIdAndUpdate(testUser._id, {
        failedVerificationAttempts: 3,
        accountLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        lastFailedAttemptAt: new Date(),
      })

      await clearFailedAttempts(testUser._id)

      const user = await User.findById(testUser._id)
      expect(user.failedVerificationAttempts).toBe(0)
      expect(user.accountLockedUntil).toBeNull()
      expect(user.lastFailedAttemptAt).toBeNull()
    })

    it('should handle non-existent user gracefully', async () => {
      await expect(clearFailedAttempts('507f1f77bcf86cd799439011')).resolves.not.toThrow()
    })
  })

  describe('unlockAccount', () => {
    it('should unlock locked account', async () => {
      await User.findByIdAndUpdate(testUser._id, {
        failedVerificationAttempts: 5,
        accountLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
      })

      await unlockAccount(testUser._id)

      const user = await User.findById(testUser._id)
      expect(user.failedVerificationAttempts).toBe(0)
      expect(user.accountLockedUntil).toBeNull()
      expect(user.lastFailedAttemptAt).toBeNull()
    })

    it('should handle non-existent user gracefully', async () => {
      await expect(unlockAccount('507f1f77bcf86cd799439011')).resolves.not.toThrow()
    })
  })

  describe('Constants', () => {
    it('should export MAX_FAILED_ATTEMPTS as 5', () => {
      expect(MAX_FAILED_ATTEMPTS).toBe(5)
    })

    it('should export LOCKOUT_DURATION_MS as 15 minutes', () => {
      expect(LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000)
    })
  })
})
