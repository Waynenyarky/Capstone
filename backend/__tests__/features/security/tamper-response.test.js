const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../../src/jobs', () => ({
  startJobs: jest.fn(),
  stopJobs: jest.fn(),
}))

const connectDB = require('../../../services/auth-service/src/config/db')
const { signAccessToken } = require('../../../services/auth-service/src/middleware/auth')
const calculateAuditHash = require('../../../services/auth-service/src/lib/auditLogger').calculateAuditHash
const AuditLog = require('../../../services/auth-service/src/models/AuditLog')
const TamperIncident = require('../../../services/admin-service/src/models/TamperIncident')
const Role = require('../../../services/auth-service/src/models/Role')
const User = require('../../../services/auth-service/src/models/User')
const verifyAuditIntegrity = require('../../../services/auth-service/src/jobs/verifyAuditIntegrity')

const { app } = require('../../../services/auth-service/src/index')

describe('Tamper response flow', () => {
  let mongo
  let adminUser
  let adminToken

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.AUDIT_VERIFY_WINDOW_HOURS = '24'
    process.env.AUDIT_VERIFY_MAX = '200'

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()
    await connectDB(process.env.MONGO_URI)

    const role =
      (await Role.findOne({ slug: 'admin' })) ||
      (await Role.create({ name: 'Admin', slug: 'admin' }))

    adminUser = await User.create({
      role: role._id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      termsAccepted: true,
      isStaff: true,
    })

    const signed = signAccessToken({
      _id: adminUser._id,
      email: adminUser.email,
      role: { slug: 'admin' },
      tokenVersion: adminUser.tokenVersion,
    })
    adminToken = signed.token
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongo.stop()
  })

  afterEach(async () => {
    await AuditLog.deleteMany({})
    await TamperIncident.deleteMany({})
  })

  async function createAuditLog({ tamper = false, withTx = true } = {}) {
    const timestamp = new Date().toISOString()
    const hash = calculateAuditHash(
      adminUser._id,
      'security_event',
      'system',
      'old',
      'new',
      'admin',
      {},
      timestamp
    )

    const auditLog = await AuditLog.create({
      userId: adminUser._id,
      eventType: 'security_event',
      fieldChanged: 'system',
      oldValue: 'old',
      newValue: 'new',
      role: 'admin',
      metadata: {},
      hash,
      txHash: withTx ? '0xtest' : '',
      createdAt: new Date(timestamp),
    })

    if (tamper) {
      await AuditLog.findByIdAndUpdate(auditLog._id, { newValue: 'tampered' })
    }

    return auditLog
  }

  describe('verifyAuditIntegrity job', () => {
    test('records tamper incident when hash mismatch is detected', async () => {
      await createAuditLog({ tamper: true })

      const result = await verifyAuditIntegrity()

      expect(result.incidents).toBe(1)
      const incident = await TamperIncident.findOne({})
      expect(incident).toBeTruthy()
      expect(incident.verificationStatus).toBe('tamper_detected')
      expect(incident.containmentActive).toBe(true)
      expect(incident.status).toBe('new')
    })

    test('classifies missing on-chain tx as not_logged (no containment)', async () => {
      await createAuditLog({ tamper: false, withTx: false })

      const result = await verifyAuditIntegrity()

      expect(result.incidents).toBe(1)
      const incident = await TamperIncident.findOne({})
      expect(incident).toBeTruthy()
      expect(incident.verificationStatus).toBe('not_logged')
      expect(incident.containmentActive).toBe(false)
    })
  })

  describe('Tamper incidents admin API', () => {
    test('lists and updates incident lifecycle with auth', async () => {
      const incident = await TamperIncident.create({
        status: 'new',
        severity: 'high',
        verificationStatus: 'tamper_detected',
        message: 'Test incident',
        affectedUserIds: [adminUser._id],
        auditLogIds: [],
        containmentActive: true,
      })

      const authHeader = { Authorization: `Bearer ${adminToken}` }

      const listRes = await request(app)
        .get('/api/admin/tamper/incidents')
        .set(authHeader)
        .expect(200)
      expect(listRes.body.incidents).toHaveLength(1)
      expect(listRes.body.incidents[0].id).toBe(String(incident._id))

      const ackRes = await request(app)
        .post(`/api/admin/tamper/incidents/${incident._id}/ack`)
        .set(authHeader)
        .expect(200)
      expect(ackRes.body.incident.status).toBe('acknowledged')

      const containRes = await request(app)
        .post(`/api/admin/tamper/incidents/${incident._id}/contain`)
        .set(authHeader)
        .send({ containmentActive: false })
        .expect(200)
      expect(containRes.body.incident.containmentActive).toBe(false)

      const resolveRes = await request(app)
        .post(`/api/admin/tamper/incidents/${incident._id}/resolve`)
        .set(authHeader)
        .send({ resolutionNotes: 'fixed' })
        .expect(200)
      expect(resolveRes.body.incident.status).toBe('resolved')
      expect(resolveRes.body.incident.resolutionNotes).toBe('fixed')
    })
  })
})
