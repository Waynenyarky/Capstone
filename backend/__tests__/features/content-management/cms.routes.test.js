const request = require('supertest')
const mongoose = require('mongoose')
const { app } = require('../../services/admin-service/src/index')
const FaqSection = require('../../services/admin-service/src/models/FaqSection')
const InstructionContent = require('../../services/admin-service/src/models/InstructionContent')
const User = require('../../services/admin-service/src/models/User')

describe('CMS Routes', () => {
  let adminUser
  let authToken

  beforeAll(async () => {
    // Create test admin user
    adminUser = await User.create({
      email: 'cms-test-admin@example.com',
      username: 'cms-test-admin',
      password: 'hashedPassword123',
      role: 'admin',
      isActive: true,
    })

    // Generate mock JWT token (in real app, use auth endpoint)
    authToken = 'mock-jwt-token-for-admin'
  })

  afterAll(async () => {
    await User.deleteMany({ email: 'cms-test-admin@example.com' })
    await FaqSection.deleteMany({ slotId: /^test-/ })
    await InstructionContent.deleteMany({ slotId: /^test-/ })
    await mongoose.connection.close()
  })

  describe('Public FAQ Routes', () => {
    beforeAll(async () => {
      await FaqSection.create({
        slotId: 'test-public-faq',
        title: 'Test FAQ',
        subtitle: 'Test subtitle',
        items: [
          { key: '1', question: 'Test Q1', answer: 'Test A1' },
          { key: '2', question: 'Test Q2', answer: 'Test A2' },
        ],
      })
    })

    afterAll(async () => {
      await FaqSection.deleteOne({ slotId: 'test-public-faq' })
    })

    test('GET /api/cms/faq/:slotId should return FAQ section', async () => {
      const res = await request(app).get('/api/cms/faq/test-public-faq')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('slotId', 'test-public-faq')
      expect(res.body).toHaveProperty('items')
      expect(res.body.items).toHaveLength(2)
    })

    test('GET /api/cms/faq/:slotId should return 404 for non-existent slot', async () => {
      const res = await request(app).get('/api/cms/faq/non-existent')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Public Instruction Routes', () => {
    beforeAll(async () => {
      await InstructionContent.create({
        slotId: 'test-public-instruction',
        title: 'Test Instruction',
        description: 'Test description',
        bulletPoints: [
          { title: 'BP1', content: 'Content 1' },
        ],
        faqItems: [
          { key: '1', question: 'Test Q', answer: 'Test A' },
        ],
      })
    })

    afterAll(async () => {
      await InstructionContent.deleteOne({ slotId: 'test-public-instruction' })
    })

    test('GET /api/cms/instructions/:slotId should return instruction content', async () => {
      const res = await request(app).get('/api/cms/instructions/test-public-instruction')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('slotId', 'test-public-instruction')
      expect(res.body).toHaveProperty('description')
    })

    test('GET /api/cms/instructions/:slotId should return 404 for non-existent slot', async () => {
      const res = await request(app).get('/api/cms/instructions/non-existent')
      expect(res.status).toBe(404)
    })
  })

  describe('Admin FAQ Routes', () => {
    beforeAll(async () => {
      await FaqSection.create({
        slotId: 'test-admin-faq',
        title: 'Test Admin FAQ',
        items: [
          { key: '1', question: 'Q1', answer: 'A1' },
          { key: '2', question: 'Q2', answer: 'A2' },
        ],
      })
    })

    afterAll(async () => {
      await FaqSection.deleteOne({ slotId: 'test-admin-faq' })
    })

    test('GET /api/admin/cms/faq should list all FAQ sections', async () => {
      const res = await request(app)
        .get('/api/admin/cms/faq')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('PUT /api/admin/cms/faq/:slotId should update FAQ items', async () => {
      const updatedItems = [
        { key: '1', question: 'Updated Q1', answer: 'Updated A1' },
        { key: '2', question: 'Updated Q2', answer: 'Updated A2' },
      ]
      const res = await request(app)
        .put('/api/admin/cms/faq/test-admin-faq')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: updatedItems })
      expect(res.status).toBe(200)
      expect(res.body.items[0].question).toBe('Updated Q1')
    })

    test('PUT /api/admin/cms/faq/:slotId should reject item count change', async () => {
      const invalidItems = [
        { key: '1', question: 'Q1', answer: 'A1' },
      ]
      const res = await request(app)
        .put('/api/admin/cms/faq/test-admin-faq')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: invalidItems })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Cannot add, remove, or reorder')
    })

    test('PUT /api/admin/cms/faq/:slotId should reject item reorder', async () => {
      const reorderedItems = [
        { key: '2', question: 'Q2', answer: 'A2' },
        { key: '1', question: 'Q1', answer: 'A1' },
      ]
      const res = await request(app)
        .put('/api/admin/cms/faq/test-admin-faq')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: reorderedItems })
      expect(res.status).toBe(400)
    })
  })

  describe('Admin Instruction Routes', () => {
    beforeAll(async () => {
      await InstructionContent.create({
        slotId: 'test-admin-instruction',
        title: 'Test Admin Instruction',
        description: 'Original description',
        bulletPoints: [],
        faqItems: [],
      })
    })

    afterAll(async () => {
      await InstructionContent.deleteOne({ slotId: 'test-admin-instruction' })
    })

    test('GET /api/admin/cms/instructions should list all instructions', async () => {
      const res = await request(app)
        .get('/api/admin/cms/instructions')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('PUT /api/admin/cms/instructions/:slotId should update instruction content', async () => {
      const res = await request(app)
        .put('/api/admin/cms/instructions/test-admin-instruction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated description' })
      expect(res.status).toBe(200)
      expect(res.body.description).toBe('Updated description')
    })

    test('PUT /api/admin/cms/instructions/:slotId should update bullet points', async () => {
      const bulletPoints = [
        { title: 'New BP', content: 'New content' },
      ]
      const res = await request(app)
        .put('/api/admin/cms/instructions/test-admin-instruction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bulletPoints })
      expect(res.status).toBe(200)
      expect(res.body.bulletPoints).toHaveLength(1)
    })

    test('PUT /api/admin/cms/instructions/:slotId should return 404 for non-existent slot', async () => {
      const res = await request(app)
        .put('/api/admin/cms/instructions/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Test' })
      expect(res.status).toBe(404)
    })
  })
})
