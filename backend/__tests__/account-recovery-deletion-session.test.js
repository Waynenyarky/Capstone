const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../src/config/db')
const { seedDevDataIfEmpty } = require('../src/lib/seedDev')
const User = require('../src/models/User')
const Role = require('../src/models/Role')
const OfficeHours = require('../src/models/OfficeHours')
const TemporaryCredential = require('../src/models/TemporaryCredential')
const RecoveryRequest = require('../src/models/RecoveryRequest')
const Session = require('../src/models/Session')
const AdminDeletionRequest = require('../src/models/AdminDeletionRequest')
const ResetRequest = require('../src/models/ResetRequest')
const DeleteRequest = require('../src/models/DeleteRequest')
const { signAccessToken } = require('../src/middleware/auth')
const bcrypt = require('bcryptjs')

describe('Account Recovery, Deletion & Session Management', () => {
  let mongo
  let app
  let businessOwner
  let staffUser
  let adminUser
  let businessOwnerToken
  let staffToken
  let adminToken

  async function createVerifiedResetRequest(email, resetToken) {
    await ResetRequest.deleteMany({ email: email.toLowerCase() })
    return ResetRequest.create({
      email: email.toLowerCase(),
      code: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: true,
      resetToken,
    })
  }

  async function createVerifiedDeleteRequest(email, deleteToken) {
    await DeleteRequest.deleteMany({ email: email.toLowerCase() })
    return DeleteRequest.create({
      email: email.toLowerCase(),
      code: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: true,
      deleteToken,
    })
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.SEED_DEV = 'true'
    process.env.EMAIL_HOST = 'localhost'
    process.env.EMAIL_HOST_USER = 'test'
    process.env.EMAIL_HOST_PASSWORD = 'test'
    process.env.DEFAULT_FROM_EMAIL = 'no-reply@example.com'
    process.env.AUDIT_CONTRACT_ADDRESS = ''

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)
    await seedDevDataIfEmpty()

    // Get roles
    const businessOwnerRole = await Role.findOne({ slug: 'business_owner' })
    const staffRole = await Role.findOne({ slug: 'lgu_officer' })
    const adminRole = await Role.findOne({ slug: 'admin' })

    // Create test users
    const passwordHash = await bcrypt.hash('TestPassword123!', 10)
    
    businessOwner = await User.create({
      role: businessOwnerRole._id,
      firstName: 'Business',
      lastName: 'Owner',
      email: 'businessowner@test.com',
      phoneNumber: '+10000000001', // Ensure unique phone number (field is unique)
      passwordHash,
      termsAccepted: true,
      isEmailVerified: true,
    })

    staffUser = await User.create({
      role: staffRole._id,
      firstName: 'Staff',
      lastName: 'User',
      email: 'staff@test.com',
      phoneNumber: '+10000000002', // Ensure unique phone number
      passwordHash,
      office: 'OSBC',
      isStaff: true,
      isActive: true,
      termsAccepted: true,
      isEmailVerified: true,
    })

    adminUser = await User.create({
      role: adminRole._id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      phoneNumber: '+10000000003', // Ensure unique phone number
      passwordHash,
      mfaEnabled: true,
      termsAccepted: true,
      isEmailVerified: true,
    })

    // Reload users with populated roles for correct role slugs in JWT
    businessOwner = await User.findById(businessOwner._id).populate('role')
    staffUser = await User.findById(staffUser._id).populate('role')
    adminUser = await User.findById(adminUser._id).populate('role')

    // Generate tokens
    businessOwnerToken = signAccessToken(businessOwner).token
    staffToken = signAccessToken(staffUser).token
    adminToken = signAccessToken(adminUser).token

    // Create app
    const { app: appInstance } = require('../src/index')
    app = appInstance
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongo.stop()
  })

  describe('1. Business Owner Password Recovery', () => {
    test('should initiate password recovery with suspicious activity detection', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'businessowner@test.com' })

      expect(res.status).toBe(200)
      expect(res.body.sent).toBe(true)
    })

    test('should verify code and get reset token', async () => {
      // Create reset request
      const code = '123456'
      await ResetRequest.deleteMany({ email: 'businessowner@test.com' })
      await ResetRequest.create({
        email: 'businessowner@test.com',
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
      })

      const res = await request(app)
        .post('/api/auth/verify-code')
        .send({ email: 'businessowner@test.com', code })

      expect(res.status).toBe(200)
      expect(res.body.verified).toBe(true)
      expect(res.body.resetToken).toBeDefined()
    })

    test('should change password with validation and session invalidation', async () => {
      // Create verified reset request
      const resetToken = 'test-reset-token-123'
      await createVerifiedResetRequest('businessowner@test.com', resetToken)

      const newPassword = 'NewPassword123!@#'
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          email: 'businessowner@test.com',
          resetToken,
          password: newPassword,
        })

      expect(res.status).toBe(200)
      expect(res.body.updated).toBe(true)
      expect(res.body.mfaReEnrollmentRequired).toBe(true)

      // Verify password was changed
      const updatedUser = await User.findById(businessOwner._id)
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.passwordHash)
      expect(passwordMatch).toBe(true)

      // Verify tokenVersion was incremented (sessions invalidated)
      expect(updatedUser.tokenVersion).toBeGreaterThan(businessOwner.tokenVersion || 0)

      // Refresh business owner token after tokenVersion change
      businessOwner = await User.findById(businessOwner._id).populate('role')
      businessOwnerToken = signAccessToken(businessOwner).token
    })

    test('should reject weak password', async () => {
      const resetToken = 'test-reset-token-weak'
      await createVerifiedResetRequest('businessowner@test.com', resetToken)

      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          email: 'businessowner@test.com',
          resetToken,
          password: 'weak', // Too short
        })

      expect(res.status).toBe(400)
      expect(['weak_password', 'validation_error']).toContain(res.body.error.code)
    })

    test('should reject password in history', async () => {
      // Add password to history
      const oldPasswordHash = await bcrypt.hash('OldPassword123!@#', 10)
      const user = await User.findById(businessOwner._id)
      user.passwordHistory = [oldPasswordHash]
      await user.save()

      const resetToken = 'test-reset-token-history'
      await createVerifiedResetRequest('businessowner@test.com', resetToken)

      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          email: 'businessowner@test.com',
          resetToken,
          password: 'OldPassword123!@#', // Same as in history
        })

      expect([400, 401]).toContain(res.status)
      expect(['password_in_history', 'invalid_reset_token']).toContain(res.body.error.code)
    })
  })

  describe('2. Staff Recovery Request Flow', () => {
    test('should allow staff to request recovery', async () => {
      const res = await request(app)
        .post('/api/auth/staff/recovery-request')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ reason: 'Forgot password' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.recoveryRequestId).toBeDefined()

      // Verify recovery request was created
      const recoveryRequest = await RecoveryRequest.findOne({
        userId: staffUser._id,
        status: 'pending',
      })
      expect(recoveryRequest).toBeDefined()
    })

    test('should allow admin to view recovery requests', async () => {
      const res = await request(app)
        .get('/api/auth/admin/recovery-requests')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.requests).toBeDefined()
      expect(Array.isArray(res.body.requests)).toBe(true)
    })

    test('should allow admin to issue temporary credentials', async () => {
      // Create recovery request
      const recoveryRequest = await RecoveryRequest.create({
        userId: staffUser._id,
        requestedBy: staffUser._id,
        status: 'pending',
        office: 'OSBC',
        role: 'lgu_officer',
      })

      const res = await request(app)
        .post('/api/auth/admin/issue-temporary-credentials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recoveryRequestId: String(recoveryRequest._id),
          expiresInHours: 24,
          expiresAfterFirstLogin: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.username).toBeDefined()
      expect(res.body.temporaryCredentialId).toBeDefined()

      // Verify temporary credential was created
      const tempCred = await TemporaryCredential.findById(res.body.temporaryCredentialId)
      expect(tempCred).toBeDefined()
      expect(tempCred.isExpired).toBe(false)
    })

    test('should allow admin to deny recovery request', async () => {
      const recoveryRequest = await RecoveryRequest.create({
        userId: staffUser._id,
        requestedBy: staffUser._id,
        status: 'pending',
        office: 'OSBC',
        role: 'lgu_officer',
      })

      const res = await request(app)
        .post('/api/auth/admin/deny-recovery-request')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recoveryRequestId: String(recoveryRequest._id),
          reason: 'Identity verification failed',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Verify request was denied
      const updatedRequest = await RecoveryRequest.findById(recoveryRequest._id)
      expect(updatedRequest.status).toBe('denied')
      expect(updatedRequest.denialReason).toBe('Identity verification failed')
    })

    test('should allow staff to login with temporary credentials', async () => {
      // Create temporary credential
      const tempPassword = 'TempPass123!'
      const tempPasswordHash = await bcrypt.hash(tempPassword, 10)
      const tempCred = await TemporaryCredential.create({
        userId: staffUser._id,
        username: 'tempuser123',
        tempPasswordHash,
        issuedBy: adminUser._id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        expiresAfterFirstLogin: true,
      })

      const res = await request(app)
        .post('/api/auth/staff/login-temporary')
        .send({
          username: 'tempuser123',
          password: tempPassword,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.user.token).toBeDefined()
      expect(res.body.requiresPasswordChange).toBe(true)
      expect(res.body.requiresMfaSetup).toBe(true)

      // Verify credential was marked as used
      const updatedCred = await TemporaryCredential.findById(tempCred._id)
      expect(updatedCred.usedAt).toBeDefined()
      expect(updatedCred.isExpired).toBe(true)

      // Refresh staff token after tokenVersion changes
      staffUser = await User.findById(staffUser._id).populate('role')
      staffToken = signAccessToken(staffUser).token
    })
  })

  describe('3. Account Deletion - Business Owner', () => {
    test('should require legal acknowledgment for deletion', async () => {
      // Create delete request
      const deleteRequest = await createVerifiedDeleteRequest('businessowner@test.com', 'test-delete-token')

      const res = await request(app)
        .post('/api/auth/delete-account/confirm')
        .send({
          email: 'businessowner@test.com',
          deleteToken: 'test-delete-token',
          legalAcknowledgment: false, // Missing acknowledgment
        })

      expect(res.status).toBe(400)
      expect(['legal_acknowledgment_required', 'validation_error']).toContain(res.body.error.code)
    })

    test('should schedule deletion with undo token', async () => {
      const deleteRequest = await createVerifiedDeleteRequest('businessowner@test.com', 'test-delete-token-undo')

      const res = await request(app)
        .post('/api/auth/delete-account/confirm')
        .send({
          email: 'businessowner@test.com',
          deleteToken: 'test-delete-token-undo',
          legalAcknowledgment: true,
        })

      expect([200, 401]).toContain(res.status)
      expect(res.body.scheduled).toBe(true)
      expect(res.body.user.deletionPending).toBe(true)
      expect(res.body.user.undoToken).toBeDefined()
      expect(res.body.user.undoExpiresAt).toBeDefined()

      // Verify user was updated
      const updatedUser = await User.findById(businessOwner._id)
      expect(updatedUser.deletionPending).toBe(true)
      expect(updatedUser.deletionUndoToken).toBeDefined()
    })

    test('should allow undoing deletion with token', async () => {
      // Set up user with pending deletion
      const undoToken = 'test-undo-token-123'
      const user = await User.findById(businessOwner._id)
      user.deletionPending = true
      user.deletionUndoToken = undoToken
      user.deletionUndoExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await user.save()

      const res = await request(app)
        .post('/api/auth/delete-account/cancel')
        .send({ undoToken })

      expect(res.status).toBe(200)
      expect(res.body.cancelled).toBe(true)

      // Verify user was updated
      const updatedUser = await User.findById(businessOwner._id)
      expect(updatedUser.deletionPending).toBe(false)
      expect(updatedUser.deletionUndoToken).toBeNull()
    })
  })

  describe('4. Account Deletion - Staff', () => {
    test('should allow staff to request deletion', async () => {
      const res = await request(app)
        .post('/api/auth/staff/request-deletion')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          legalAcknowledgment: true,
          reason: 'No longer working',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Verify user was updated
      const updatedUser = await User.findById(staffUser._id)
      expect(updatedUser.deletionPending).toBe(true)
    })

    test('should allow admin to view staff deletion requests', async () => {
      const res = await request(app)
        .get('/api/auth/admin/staff-deletion-requests')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.requests).toBeDefined()
      expect(Array.isArray(res.body.requests)).toBe(true)
    })

    test('should allow admin to approve staff deletion', async () => {
      // Set up staff user with pending deletion
      const user = await User.findById(staffUser._id)
      user.deletionPending = true
      user.deletionRequestedAt = new Date()
      await user.save()

      const res = await request(app)
        .post('/api/auth/admin/approve-staff-deletion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: String(staffUser._id),
          approve: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.scheduledFor).toBeDefined()

      // Verify user was updated
      const updatedUser = await User.findById(staffUser._id)
      expect(updatedUser.deletionScheduledFor).toBeDefined()
      expect(updatedUser.isActive).toBe(false)
    })

    test('should allow admin to deny staff deletion', async () => {
      // Set up staff user with pending deletion
      const user = await User.findById(staffUser._id)
      user.deletionPending = true
      user.deletionRequestedAt = new Date()
      await user.save()

      const res = await request(app)
        .post('/api/auth/admin/approve-staff-deletion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: String(staffUser._id),
          approve: false,
          reason: 'Ongoing tasks assigned',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Verify user was updated
      const updatedUser = await User.findById(staffUser._id)
      expect(updatedUser.deletionPending).toBe(false)
    })
  })

  describe('5. Account Deletion - Admin', () => {
    test('should require MFA for admin deletion request', async () => {
      // Mock MFA verification (in real test, you'd need to set up MFA)
      // For now, this will fail MFA verification
      const res = await request(app)
        .post('/api/auth/admin/request-deletion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          legalAcknowledgment: true,
          mfaCode: '000000', // Invalid MFA code
        })

      // Should fail MFA verification
      expect([400, 401]).toContain(res.status)
    })

    test('should allow admin to view pending admin deletions', async () => {
      const res = await request(app)
        .get('/api/auth/admin/pending-deletions')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.requests).toBeDefined()
      expect(Array.isArray(res.body.requests)).toBe(true)
    })
  })

  describe('6. Session Management', () => {
    test('should update session activity', async () => {
      const res = await request(app)
        .post('/api/auth/session/activity')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.lastActivityAt).toBeDefined()
    })

    test('should get active sessions', async () => {
      // Create a test session
      await Session.create({
        userId: businessOwner._id,
        tokenVersion: businessOwner.tokenVersion || 0,
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: true,
      })

      const res = await request(app)
        .get('/api/auth/session/active')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.sessions).toBeDefined()
      expect(Array.isArray(res.body.sessions)).toBe(true)
    })

    test('should invalidate specific session', async () => {
      const session = await Session.create({
        userId: businessOwner._id,
        tokenVersion: businessOwner.tokenVersion || 0,
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: true,
      })

      const res = await request(app)
        .post('/api/auth/session/invalidate')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({ sessionId: String(session._id) })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Verify session was invalidated
      const updatedSession = await Session.findById(session._id)
      expect(updatedSession.isActive).toBe(false)
    })

    test('should invalidate all sessions', async () => {
      // Create multiple sessions
      await Session.create({
        userId: businessOwner._id,
        tokenVersion: (businessOwner.tokenVersion || 0) - 1, // Different version
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: true,
      })

      const res = await request(app)
        .post('/api/auth/session/invalidate-all')
        .set('Authorization', `Bearer ${businessOwnerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.sessionsInvalidated).toBeGreaterThan(0)
    })
  })

  describe('7. Office Hours Validation', () => {
    test('should validate office hours', async () => {
      // Create office hours
      await OfficeHours.create({
        office: 'OSBC',
        monday: { start: '08:00', end: '17:00', isWorkingDay: true },
        tuesday: { start: '08:00', end: '17:00', isWorkingDay: true },
        wednesday: { start: '08:00', end: '17:00', isWorkingDay: true },
        thursday: { start: '08:00', end: '17:00', isWorkingDay: true },
        friday: { start: '08:00', end: '17:00', isWorkingDay: true },
        saturday: { start: '08:00', end: '12:00', isWorkingDay: false },
        sunday: { start: '08:00', end: '12:00', isWorkingDay: false },
      })

      const { isWithinOfficeHours } = require('../src/lib/officeHoursValidator')
      const check = await isWithinOfficeHours('OSBC', new Date('2024-01-15T02:00:00Z')) // Monday 10 AM Manila (UTC+8)

      expect(check.isWithinHours).toBe(true)
    })
  })

  describe('8. High-Privilege Task Checking', () => {
    test('should check for high-privilege tasks', async () => {
      const { checkHighPrivilegeTasks } = require('../src/lib/highPrivilegeTaskChecker')
      const result = await checkHighPrivilegeTasks(adminUser._id)

      expect(result).toBeDefined()
      expect(result.hasTasks).toBeDefined()
      expect(result.tasks).toBeDefined()
      expect(result.details).toBeDefined()
    })
  })

  describe('9. IP Tracking', () => {
    test('should track IP addresses', async () => {
      const { trackIP, getRecentIPs } = require('../src/lib/ipTracker')
      
      await trackIP(businessOwner._id, '192.168.1.1')
      
      const recentIPs = await getRecentIPs(businessOwner._id)
      expect(recentIPs.length).toBeGreaterThan(0)
      expect(recentIPs[0].ip).toBe('192.168.1.1')
    })

    test('should detect unusual IP', async () => {
      // Add some IPs to history
      const user = await User.findById(businessOwner._id)
      user.recentLoginIPs = [
        { ip: '192.168.1.1', timestamp: new Date(), location: '' },
        { ip: '192.168.1.2', timestamp: new Date(), location: '' },
      ]
      await user.save()

      const { isUnusualIP } = require('../src/lib/ipTracker')
      const check = await isUnusualIP(businessOwner._id, '10.0.0.1') // Different IP

      expect(check.isUnusual).toBe(true)
    })
  })
})
