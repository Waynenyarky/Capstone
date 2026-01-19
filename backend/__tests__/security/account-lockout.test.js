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
const { checkLockout, incrementFailedAttempts, clearFailedAttempts } = require('../../services/auth-service/src/lib/accountLockout')

describe('Account Lockout Tests', () => {
  let mongo
  let app
  let lockoutUser

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
    lockoutUser = await createTestUser({
      roleSlug: 'business_owner',
      extraFields: {
        failedVerificationAttempts: 0,
        accountLockedUntil: null,
      },
    })
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
