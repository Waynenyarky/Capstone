const express = require('express')
const request = require('supertest')

// Mock models to avoid DB dependency
jest.mock('../../../services/auth-service/src/models/Role', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
}))

jest.mock('../../../services/auth-service/src/models/User', () => ({
  find: jest.fn(),
}))

jest.mock('../../../services/auth-service/src/models/MfaBootstrapToken', () => ({
  create: jest.fn(),
}))

// Import mocked modules after jest.mock
const Role = require('../../../services/auth-service/src/models/Role')
const User = require('../../../services/auth-service/src/models/User')
const MfaBootstrapToken = require('../../../services/auth-service/src/models/MfaBootstrapToken')

describe('POST /api/auth/admin/bootstrap-mfa-bulk (dev helper)', () => {
  const bootstrapKey = 'test-bootstrap-key'

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NODE_ENV = 'development'
    process.env.MFA_BOOTSTRAP_KEY = bootstrapKey
  })

  function buildApp() {
    const app = express()
    app.use(express.json())
    const router = require('../../../services/auth-service/src/routes/mfaBootstrap')
    app.use('/api/auth', router)
    return app
  }

  it('creates bootstrap tokens and seeds MFA secrets for admin/staff', async () => {
    Role.findOne.mockResolvedValue({ _id: 'adminRoleId', slug: 'admin' })
    Role.find.mockResolvedValue([{ _id: 'staffRoleId', slug: 'lgu_officer' }])

    const fakeUsers = [
      {
        _id: 'adminUserId',
        email: 'admin@example.com',
        passwordHash: 'hash-admin',
        role: { _id: 'adminRoleId', slug: 'admin' },
        mfaSecret: '',
        mfaEnabled: false,
        mustSetupMfa: true,
        mfaMethod: '',
        save: jest.fn(),
      },
      {
        _id: 'staffUserId',
        email: 'officer@example.com',
        passwordHash: 'hash-staff',
        role: { _id: 'staffRoleId', slug: 'lgu_officer' },
        mfaSecret: '',
        mfaEnabled: false,
        mustSetupMfa: true,
        mfaMethod: '',
        save: jest.fn(),
      },
    ]

    User.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(fakeUsers),
    })

    let createdTokens = 0
    MfaBootstrapToken.create.mockImplementation(async () => {
      createdTokens += 1
      return { _id: `token-${createdTokens}` }
    })

    const app = buildApp()
    const res = await request(app)
      .post('/api/auth/admin/bootstrap-mfa-bulk')
      .set('Content-Type', 'application/json')
      .set('x-bootstrap-key', bootstrapKey)
      .send({ includeAdmins: true, includeStaff: true, expiresInMinutes: 30 })
      .expect(200)

    expect(res.body.count).toBe(2)
    expect(Array.isArray(res.body.results)).toBe(true)
    expect(res.body.results[0]).toHaveProperty('token')
    expect(res.body.results[0]).toHaveProperty('secret')
    expect(MfaBootstrapToken.create).toHaveBeenCalledTimes(2)
    expect(fakeUsers[0].save).toHaveBeenCalled()
    expect(fakeUsers[1].save).toHaveBeenCalled()
  })
})
