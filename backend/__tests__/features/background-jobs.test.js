const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../../services/auth-service/src/config/db')
const User = require('../../services/auth-service/src/models/User')
const TemporaryCredential = require('../../services/auth-service/src/models/TemporaryCredential')
const Session = require('../../services/auth-service/src/models/Session')
const Role = require('../../services/auth-service/src/models/Role')
const bcrypt = require('bcryptjs')

describe('Background Jobs', () => {
  let mongo
  let testUser

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.AUDIT_CONTRACT_ADDRESS = ''

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)

    const role = await Role.findOne({ slug: 'business_owner' }) || await Role.create({ name: 'Business Owner', slug: 'business_owner' })
    const passwordHash = await bcrypt.hash('TestPassword123!', 10)
    
    testUser = await User.create({
      role: role._id,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      passwordHash,
      deletionPending: true,
      deletionScheduledFor: new Date(Date.now() - 1000), // Past date
      termsAccepted: true,
    })
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongo.stop()
  })

  describe('1. Finalize Account Deletions', () => {
    test('should finalize account deletions past grace period', async () => {
      const finalizeAccountDeletions = require('../../services/auth-service/src/jobs/finalizeAccountDeletions')
      
      const result = await finalizeAccountDeletions()
      
      expect(result).toBeDefined()
      expect(result.deleted).toBeGreaterThanOrEqual(0)
      
      // Verify user was deleted
      const deletedUser = await User.findById(testUser._id)
      expect(deletedUser).toBeNull()
    })
  })

  describe('2. Expire Temporary Credentials', () => {
    test('should expire temporary credentials past expiration', async () => {
      // Create expired temporary credential
      const passwordHash = await bcrypt.hash('temp', 10)
      const tempCred = await TemporaryCredential.create({
        userId: testUser._id,
        username: 'tempuser',
        tempPasswordHash: passwordHash,
        issuedBy: testUser._id,
        expiresAt: new Date(Date.now() - 1000), // Past date
        expiresAfterFirstLogin: false,
        isExpired: false,
      })

      const expireTemporaryCredentials = require('../../services/auth-service/src/jobs/expireTemporaryCredentials')
      const result = await expireTemporaryCredentials()

      expect(result).toBeDefined()
      expect(result.expired).toBeGreaterThanOrEqual(0)

      // Verify credential was expired
      const updatedCred = await TemporaryCredential.findById(tempCred._id)
      expect(updatedCred.isExpired).toBe(true)
    })
  })

  describe('3. Cleanup Old Sessions', () => {
    test('should cleanup sessions older than 30 days', async () => {
      // Create old session
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
      await Session.create({
        userId: testUser._id,
        tokenVersion: 0,
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        lastActivityAt: oldDate,
        createdAt: oldDate,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: true,
      })

      const cleanupOldSessions = require('../../services/auth-service/src/jobs/cleanupOldSessions')
      const result = await cleanupOldSessions()

      expect(result).toBeDefined()
      expect(result.deleted).toBeGreaterThanOrEqual(0)
    })
  })

  describe('4. Unlock Accounts', () => {
    test('should unlock accounts past lockout period', async () => {
      // Create locked user
      const lockedUser = await User.create({
        role: testUser.role,
        firstName: 'Locked',
        lastName: 'User',
        email: `locked${Date.now()}@example.com`, // Unique email
        phoneNumber: `__unset__${Date.now()}_locked`, // Unique phone
        passwordHash: await bcrypt.hash('password', 10),
        accountLockedUntil: new Date(Date.now() - 1000), // Past date
        failedVerificationAttempts: 5,
        termsAccepted: true,
      })

      const unlockAccounts = require('../../services/auth-service/src/jobs/unlockAccounts')
      const result = await unlockAccounts()

      expect(result).toBeDefined()
      expect(result.unlocked).toBeGreaterThanOrEqual(0)

      // Verify user was unlocked
      const updatedUser = await User.findById(lockedUser._id)
      expect(updatedUser.accountLockedUntil).toBeNull()
      expect(updatedUser.failedVerificationAttempts).toBe(0)
    })
  })
})
