/**
 * Permit Forms Section Integration Tests
 * Tests the CRUD operations, publish/revert workflow, enable/disable toggle,
 * and audit logging for the permit forms feature.
 */

const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer, app

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  const adminMongoose = require('../../../services/admin-service/src/models/AuditLog').base
  await adminMongoose.connect(uri)

  const adminService = require('../../../services/admin-service/src/index')
  app = adminService.app || adminService
})

afterAll(async () => {
  const adminMongoose = require('../../../services/admin-service/src/models/AuditLog').base
  await adminMongoose.disconnect()
  await mongoServer.stop()
})

const User = require('../../../services/admin-service/src/models/User')
const Role = require('../../../services/admin-service/src/models/Role')
const PermitFormsSection = require('../../../services/admin-service/src/models/PermitFormsSection')
const { signAccessToken } = require('../../../services/admin-service/src/middleware/auth')

let adminToken, adminId

async function setupAdmin() {
  const bcrypt = require('bcryptjs')
  const ts = Date.now()

  const adminRole = await Role.findOneAndUpdate(
    { slug: 'admin' },
    { name: 'Admin', slug: 'admin' },
    { upsert: true, new: true }
  )

  const admin = await User.create({
    role: adminRole._id,
    firstName: 'Admin',
    lastName: 'PermitForms',
    email: `admin_pf_${ts}@test.com`,
    phoneNumber: `__unset__pf_${ts}`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    termsAccepted: true,
    tokenVersion: 0,
  })
  adminId = admin._id.toString()
  adminToken = signAccessToken({ ...admin.toObject(), role: adminRole }).token
}

beforeEach(async () => {
  await PermitFormsSection.deleteMany({})
  if (!adminToken) await setupAdmin()
})

describe('GET /api/admin/permit-forms', () => {
  it('returns empty section for new setup (public)', async () => {
    const res = await request(app)
      .get('/api/admin/permit-forms')
      .expect(200)
    expect(res.body.cards).toEqual([])
    expect(res.body.isEnabled).toBe(false)
  })

  it('returns full section for admin', async () => {
    const res = await request(app)
      .get('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('cards')
    expect(res.body).toHaveProperty('sectionDescription')
  })
})

describe('PUT /api/admin/permit-forms', () => {
  it('saves draft cards and description', async () => {
    const payload = {
      sectionDescription: 'Test section',
      cards: [
        {
          cardId: 'card-1',
          title: 'Business Permit',
          description: 'For business registration',
          requirements: ['DTI', 'Barangay Clearance'],
          downloadableFile: { cid: '', fileName: '', size: 0 },
          order: 0,
        },
      ],
    }

    const res = await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(200)

    expect(res.body.sectionDescription).toBe('Test section')
    expect(res.body.cards).toHaveLength(1)
    expect(res.body.cards[0].title).toBe('Business Permit')
  })

  it('rejects unauthenticated requests', async () => {
    await request(app)
      .put('/api/admin/permit-forms')
      .send({ sectionDescription: 'Test' })
      .expect(401)
  })
})

describe('POST /api/admin/permit-forms/publish', () => {
  it('publishes current draft', async () => {
    // First save a draft
    await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionDescription: 'Published section',
        cards: [
          {
            cardId: 'card-1',
            title: 'Business Permit',
            description: 'Desc',
            requirements: ['Req 1'],
            downloadableFile: { cid: '', fileName: '', size: 0 },
            order: 0,
          },
        ],
      })

    const res = await request(app)
      .post('/api/admin/permit-forms/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body.isPublished).toBe(true)
    expect(res.body.publishedCards).toHaveLength(1)
    expect(res.body.lastPublishedAt).toBeTruthy()
  })

  it('rejects publishing with no cards', async () => {
    await request(app)
      .post('/api/admin/permit-forms/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400)
  })
})

describe('POST /api/admin/permit-forms/revert', () => {
  it('reverts draft to last published', async () => {
    // Save and publish
    await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionDescription: 'Original',
        cards: [{ cardId: 'c1', title: 'Original Title', description: '', requirements: [], downloadableFile: { cid: '', fileName: '', size: 0 }, order: 0 }],
      })
    await request(app)
      .post('/api/admin/permit-forms/publish')
      .set('Authorization', `Bearer ${adminToken}`)

    // Modify draft
    await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sectionDescription: 'Modified',
        cards: [{ cardId: 'c1', title: 'Modified Title', description: '', requirements: [], downloadableFile: { cid: '', fileName: '', size: 0 }, order: 0 }],
      })

    // Revert
    const res = await request(app)
      .post('/api/admin/permit-forms/revert')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body.sectionDescription).toBe('Original')
    expect(res.body.cards[0].title).toBe('Original Title')
  })

  it('rejects revert when nothing published', async () => {
    await request(app)
      .post('/api/admin/permit-forms/revert')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400)
  })
})

describe('PUT /api/admin/permit-forms/enable', () => {
  it('toggles section enabled/disabled', async () => {
    // Create section first
    await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sectionDescription: 'Test' })

    const res = await request(app)
      .put('/api/admin/permit-forms/enable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEnabled: false })
      .expect(200)

    expect(res.body.isEnabled).toBe(false)
  })

  it('rejects invalid isEnabled value', async () => {
    await request(app)
      .put('/api/admin/permit-forms/enable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEnabled: 'not-a-boolean' })
      .expect(400)
  })
})

describe('GET /api/admin/permit-forms/audit', () => {
  it('returns audit logs', async () => {
    // Make some changes to generate audit entries
    await request(app)
      .put('/api/admin/permit-forms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sectionDescription: 'Audit test' })

    const res = await request(app)
      .get('/api/admin/permit-forms/audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('logs')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page')
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  it('rejects unauthenticated requests', async () => {
    await request(app)
      .get('/api/admin/permit-forms/audit')
      .expect(401)
  })
})
