jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.resolve(),
  }),
}))

const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const bcrypt = require('bcryptjs')

const connectDB = require('../../../services/auth-service/src/config/db')
const User = require('../../../services/auth-service/src/models/User')
const Role = require('../../../services/auth-service/src/models/Role')
const Office = require('../../../services/auth-service/src/models/Office')
const AuditLog = require('../../../services/auth-service/src/models/AuditLog')
const { signAccessToken } = require('../../../services/auth-service/src/middleware/auth')

jest.setTimeout(60000)

describe('Admin staff management endpoints', () => {
  let mongo
  let app
  let adminUser
  let adminToken
  let staffUser
  let staffRole

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

    mongo = await MongoMemoryServer.create()
    const uri = mongo.getUri()
    await connectDB(uri)

    // Minimal seed: roles and one admin
    const roles = [
      { name: 'Admin', slug: 'admin' },
      { name: 'Business Owner', slug: 'business_owner' },
      { name: 'LGU Manager', slug: 'lgu_manager' },
      { name: 'LGU Officer', slug: 'lgu_officer' },
      { name: 'LGU Inspector', slug: 'inspector' },
      { name: 'CSO', slug: 'cso' },
    ]
    for (const r of roles) {
      await Role.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true })
    }

    await Office.findOneAndUpdate(
      { code: 'CTO' },
      { code: 'CTO', name: 'CTO - City Treasurer Office', group: 'Support', isActive: true },
      { upsert: true, new: true }
    )

    const adminRole = await Role.findOne({ slug: 'admin' })
    const adminHash = await bcrypt.hash('Admin#12345', 10)
    adminUser = await User.create({
      role: adminRole._id,
      firstName: 'Alice',
      lastName: 'Admin',
      email: 'admin@example.com',
      phoneNumber: '+10000000090',
      passwordHash: adminHash,
      termsAccepted: true,
      isStaff: false,
      isActive: true,
    })
    adminToken = signAccessToken({ _id: adminUser._id, role: adminRole }).token

    staffRole = await Role.findOne({ slug: 'lgu_manager' })
    const passwordHash = await bcrypt.hash('Temp#12345', 10)
    staffUser = await User.create({
      role: staffRole._id,
      firstName: 'Staff',
      lastName: 'User',
      email: 'staff.manage@example.com',
      phoneNumber: '+639000000001',
      passwordHash,
      isStaff: true,
      isActive: true,
      mustChangeCredentials: false,
      mustSetupMfa: false,
      username: 'staff.manage',
      office: 'OSBC',
    })

    const { app: authApp } = require('../../../services/auth-service/src/index')
    app = authApp
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
  })

  it('allows admin to update staff fields with reason and logs audit entries', async () => {
    const res = await request(app)
      .patch(`/api/auth/admin/staff/${staffUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Updated',
        office: 'CTO',
        isActive: false,
        reason: 'Reassignment and suspension',
      })

    expect(res.status).toBe(200)
    expect(res.body?.success).toBe(true)
    expect(res.body?.user?.firstName).toBe('Updated')
    expect(res.body?.user?.office).toBe('CTO')
    expect(res.body?.user?.isActive).toBe(false)

    const updated = await User.findById(staffUser._id)
    expect(updated.firstName).toBe('Updated')
    expect(updated.office).toBe('CTO')
    expect(updated.isActive).toBe(false)
    // tokenVersion should increment when deactivating
    expect(updated.tokenVersion || 0).toBeGreaterThan(0)

    const logs = await AuditLog.find({ userId: staffUser._id, eventType: 'profile_update' }).lean()
    expect(logs.length).toBeGreaterThanOrEqual(2)
    const hasReason = logs.some((l) => l.metadata && l.metadata.reason === 'Reassignment and suspension')
    expect(hasReason).toBe(true)
  })

  it('allows admin to issue temp password with reason and logs audit', async () => {
    const res = await request(app)
      .post(`/api/auth/admin/staff/${staffUser._id}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Security rotation',
      })

    if (res.status !== 200) {
      // Helpful output for debugging failures
      // eslint-disable-next-line no-console
      console.error('Reset response body:', res.body)
    }

    expect(res.status).toBe(200)
    expect(res.body?.success).toBe(true)
    expect(res.body?.user?.mustChangeCredentials).toBe(true)
    expect(res.body?.user?.mustSetupMfa).toBe(true)

    const updated = await User.findById(staffUser._id).lean()
    expect(updated.tokenVersion || 0).toBeGreaterThan(0)
    expect(updated.mustChangeCredentials).toBe(true)

    const log = await AuditLog.findOne({ userId: staffUser._id, eventType: 'password_change' }).lean()
    expect(log).toBeTruthy()
    expect(log.metadata?.reason).toBe('Security rotation')
  })
})
