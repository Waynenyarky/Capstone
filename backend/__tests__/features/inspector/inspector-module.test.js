/**
 * Inspector Module API Tests
 * Tests Dashboard, My Schedule, Assigned Inspections, Inspection History,
 * Violations, and Notifications endpoints for the Inspector role.
 */
const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require('../../helpers/setup')
const { createTestUser } = require('../../helpers/fixtures')
const User = require('../../../src/models/User')
const Role = require('../../../src/models/Role')
const Inspection = require('../../../src/models/Inspection')
const Violation = require('../../../src/models/Violation')
const Notification = require('../../../src/models/Notification')
const BusinessProfile = require('../../../src/models/BusinessProfile')
const { signAccessToken } = require('../../../src/middleware/auth')

jest.setTimeout(30000)

describe('Inspector Module API', () => {
  let mongo
  let app
  let inspectorUser
  let lguOfficerUser
  let businessOwnerUser
  let inspectorToken
  let businessOwnerToken
  let businessProfile
  let inspectionPending
  let inspectionCompleted
  let inspectionToday
  let violation

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()

    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          resolve()
        } else {
          mongoose.connection.once('connected', resolve)
          mongoose.connection.once('error', reject)
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        }
      })
    }

    const timestamp = Date.now()

    // Create inspector user
    inspectorUser = await createTestUser({
      roleSlug: 'inspector',
      email: `inspector${timestamp}@example.com`,
      phoneNumber: `__unset__${timestamp}_insp`,
      firstName: 'Inspector',
      lastName: 'Test',
      extraFields: { isStaff: true, isActive: true },
    })

    // Create LGU officer (assigns inspections)
    lguOfficerUser = await createTestUser({
      roleSlug: 'lgu_officer',
      email: `lgu${timestamp}@example.com`,
      phoneNumber: `__unset__${timestamp}_lgu`,
      firstName: 'LGU',
      lastName: 'Officer',
      extraFields: { isStaff: true, isActive: true },
    })

    // Create business owner user
    businessOwnerUser = await createTestUser({
      roleSlug: 'business_owner',
      email: `bo${timestamp}@example.com`,
      phoneNumber: `__unset__${timestamp}_bo`,
      firstName: 'Business',
      lastName: 'Owner',
    })

    businessOwnerToken = signAccessToken(businessOwnerUser).token
    inspectorToken = signAccessToken(inspectorUser).token

    // Create BusinessProfile with a business
    const businessId = `biz_${timestamp}`
    businessProfile = await BusinessProfile.create({
      userId: businessOwnerUser._id,
      businesses: [{
        businessId,
        isPrimary: true,
        businessName: 'Test Business',
        registeredBusinessName: 'Test Business Inc',
        businessRegistrationNumber: `BRN-${timestamp}`,
        registrationStatus: 'proposed',
      }],
    })

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Create pending inspection (yesterday)
    inspectionPending = await Inspection.create({
      inspectorId: inspectorUser._id,
      businessProfileId: businessProfile._id,
      businessId,
      permitType: 'initial',
      inspectionType: 'initial',
      scheduledDate: yesterday,
      status: 'pending',
      assignedBy: lguOfficerUser._id,
    })

    // Create completed inspection (yesterday)
    inspectionCompleted = await Inspection.create({
      inspectorId: inspectorUser._id,
      businessProfileId: businessProfile._id,
      businessId,
      permitType: 'renewal',
      inspectionType: 'renewal',
      scheduledDate: yesterday,
      status: 'completed',
      overallResult: 'passed',
      completedAt: now,
      assignedBy: lguOfficerUser._id,
    })

    // Create inspection scheduled for today
    inspectionToday = await Inspection.create({
      inspectorId: inspectorUser._id,
      businessProfileId: businessProfile._id,
      businessId,
      permitType: 'initial',
      inspectionType: 'initial',
      scheduledDate: startOfToday,
      status: 'pending',
      assignedBy: lguOfficerUser._id,
    })

    // Create violation linked to completed inspection
    violation = await Violation.create({
      inspectionId: inspectionCompleted._id,
      violationId: `VIO-${timestamp}`,
      violationType: 'sanitation',
      description: 'Test violation',
      severity: 'minor',
      complianceDeadline: tomorrow,
      status: 'open',
      inspectorId: inspectorUser._id,
    })

    // Create notification for inspector
    await Notification.create({
      userId: inspectorUser._id,
      type: 'inspection_assigned',
      title: 'Inspection Assigned',
      message: 'You have been assigned a new inspection',
      relatedEntityType: 'inspection',
      relatedEntityId: String(inspectionToday._id),
      read: false,
    })

    delete require.cache[require.resolve('../../../src/index')]
    const { app: mainApp } = require('../../../src/index')
    app = mainApp
  })

  afterAll(async () => {
    await Inspection.deleteMany({ inspectorId: inspectorUser._id })
    await Violation.deleteMany({ inspectorId: inspectorUser._id })
    await Notification.deleteMany({ userId: inspectorUser._id })
    await BusinessProfile.findByIdAndDelete(businessProfile._id)
    await User.deleteMany({
      _id: { $in: [inspectorUser._id, lguOfficerUser._id, businessOwnerUser._id] },
    })
    await teardownMongoDB(mongo)
  })

  describe('1. Dashboard (GET /api/inspector/inspections/counts)', () => {
    it('returns today, pending, and completed counts', async () => {
      const res = await request(app)
        .get('/api/inspector/inspections/counts')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        today: expect.any(Number),
        pending: expect.any(Number),
        completed: expect.any(Number),
      })
      expect(res.body.today).toBeGreaterThanOrEqual(1)
      expect(res.body.pending).toBeGreaterThanOrEqual(2)
      expect(res.body.completed).toBeGreaterThanOrEqual(1)
    })

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/inspector/inspections/counts')
      expect(res.status).toBe(401)
    })

    it('rejects non-inspector role', async () => {
      const res = await request(app)
        .get('/api/inspector/inspections/counts')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
      expect(res.status).toBe(403)
    })
  })

  describe('2. Assigned Inspections (GET /api/inspector/inspections)', () => {
    it('returns list of inspections with pagination', async () => {
      const res = await request(app)
        .get('/api/inspector/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.inspections).toBeInstanceOf(Array)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3)
      expect(res.body.pagination.page).toBe(1)
      expect(res.body.pagination.limit).toBe(20)
    })

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/inspector/inspections')
      expect(res.status).toBe(401)
    })
  })

  describe('3. My Schedule (GET /api/inspector/inspections with date filters)', () => {
    it('returns inspections filtered by dateFrom and dateTo', async () => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dateFrom = startOfToday.toISOString().split('T')[0]
      const dateTo = dateFrom

      const res = await request(app)
        .get('/api/inspector/inspections')
        .query({ dateFrom, dateTo })
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.inspections).toBeInstanceOf(Array)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.inspections.length).toBeGreaterThanOrEqual(1)
      expect(res.body.inspections.some((i) => i._id === String(inspectionToday._id))).toBe(true)
    })
  })

  describe('4. Inspection History (GET /api/inspector/inspections?status=completed)', () => {
    it('returns only completed inspections', async () => {
      const res = await request(app)
        .get('/api/inspector/inspections')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.inspections).toBeInstanceOf(Array)
      expect(res.body.inspections.every((i) => i.status === 'completed')).toBe(true)
      expect(res.body.inspections.some((i) => i._id === String(inspectionCompleted._id))).toBe(true)
    })
  })

  describe('5. Violations (GET /api/inspector/violations)', () => {
    it('returns list of violations with pagination', async () => {
      const res = await request(app)
        .get('/api/inspector/violations')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.violations).toBeInstanceOf(Array)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1)
      expect(res.body.violations.some((v) => v.violationId === violation.violationId)).toBe(true)
    })

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/inspector/violations')
      expect(res.status).toBe(401)
    })

    it('rejects non-inspector role', async () => {
      const res = await request(app)
        .get('/api/inspector/violations')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
      expect(res.status).toBe(403)
    })
  })

  describe('6. Notifications (GET /api/inspector/notifications)', () => {
    it('returns list of notifications with pagination', async () => {
      const res = await request(app)
        .get('/api/inspector/notifications')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.notifications).toBeInstanceOf(Array)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.notifications).toBeDefined()
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1)
      expect(res.body.notifications.some((n) => n.type === 'inspection_assigned')).toBe(true)
    })

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/inspector/notifications')
      expect(res.status).toBe(401)
    })
  })

  describe('7. Legal Reference (violations-catalog and ordinances)', () => {
    it('GET /api/inspector/violations-catalog returns violations', async () => {
      const res = await request(app)
        .get('/api/inspector/violations-catalog')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.violations).toBeInstanceOf(Array)
    })

    it('GET /api/inspector/ordinances returns ordinances', async () => {
      const res = await request(app)
        .get('/api/inspector/ordinances')
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.ordinances).toBeInstanceOf(Array)
    })

    it('rejects unauthenticated requests for violations-catalog', async () => {
      const res = await request(app).get('/api/inspector/violations-catalog')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated requests for ordinances', async () => {
      const res = await request(app).get('/api/inspector/ordinances')
      expect(res.status).toBe(401)
    })
  })

  describe('8. Inspection Detail (GET /api/inspector/inspections/:id)', () => {
    it('returns inspection detail for assigned inspection', async () => {
      const res = await request(app)
        .get(`/api/inspector/inspections/${inspectionPending._id}`)
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body._id).toBe(String(inspectionPending._id))
      expect(res.body.status).toBe('pending')
      expect(res.body.businessProfile).toBeDefined()
    })

    it('returns 404 for non-existent inspection', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .get(`/api/inspector/inspections/${fakeId}`)
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('9. Risk Indicators (GET /api/inspector/inspections/:id/risk-indicators)', () => {
    it('returns risk indicators for inspection', async () => {
      const res = await request(app)
        .get(`/api/inspector/inspections/${inspectionPending._id}/risk-indicators`)
        .set('Authorization', `Bearer ${inspectorToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })
  })
})
