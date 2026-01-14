jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.resolve(),
  }),
}))

const mongoose = require('mongoose')
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const fs = require('fs')
const path = require('path')

const connectDB = require('../src/config/db')
const { seedDevDataIfEmpty } = require('../src/lib/seedDev')
const User = require('../src/models/User')
const Role = require('../src/models/Role')
const { signAccessToken } = require('../src/middleware/auth')
const bcrypt = require('bcryptjs')

jest.setTimeout(60000)

function joinPaths(a, b) {
  const left = String(a || '').replace(/\/+$/, '')
  const right = String(b || '').replace(/^\/+/, '')
  const combined = [left, right].filter(Boolean).join('/')
  return combined.startsWith('/') ? combined : `/${combined}`
}

function collectRoutesFromStack(stack, prefix) {
  const routes = []
  for (const layer of stack || []) {
    if (layer && layer.route && layer.route.path) {
      const path = joinPaths(prefix, layer.route.path)
      const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m])
      for (const method of methods) {
        routes.push({ method: method.toLowerCase(), path })
      }
      continue
    }

    if (!layer || !layer.name || !layer.handle) continue

    if (layer.name === 'router' && layer.handle.stack) {
      let mount = ''
      if (layer.regexp && layer.regexp.source) {
        const src = layer.regexp.source
        const m = src.match(/^\^\\\/([^$]+?)\\\/\?\(\?=\\\/\|\$\)/)
        if (m) mount = `/${m[1].replace(/\\\//g, '/')}`
      }
      routes.push(...collectRoutesFromStack(layer.handle.stack, joinPaths(prefix, mount)))
    }
  }
  return routes
}

function uniqRoutes(routes) {
  const seen = new Set()
  const out = []
  for (const r of routes) {
    const key = `${r.method.toUpperCase()} ${r.path}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)))
}

function isDefaultExpress404(res) {
  const ct = String(res.headers['content-type'] || '')
  if (res.status !== 404) return false
  if (ct.includes('application/json')) return false
  return /Cannot (GET|POST|PUT|PATCH|DELETE)\s+\//.test(String(res.text || ''))
}

function bodyForRoute(method, path) {
  if (method === 'post' && path === '/api/auth/signup/start') {
    return {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phoneNumber: '',
      password: 'password123',
      termsAccepted: true,
      role: 'business_owner',
    }
  }

  if (method === 'post' && path === '/api/auth/login/start') {
    return { email: 'admin@example.com', password: 'password123' }
  }

  if (method === 'post' && path === '/api/auth/forgot-password') {
    return { email: 'admin@example.com' }
  }

  if (method === 'post' && path === '/api/auth/delete-account/send-code') {
    return { email: 'admin@example.com' }
  }

  if (method === 'post' && path === '/api/auth/delete-account/authenticated') {
    return { password: 'wrong-password' }
  }

  if (method === 'post' && path === '/api/auth/send-verification-email') {
    return {}
  }

  if (method === 'post' && path === '/api/auth/verify-email-token') {
    return { token: 'bad-token' }
  }

  if (method === 'post' && path === '/api/auth/mfa/setup') {
    return { method: 'authenticator' }
  }

  if (method === 'patch' && path === '/api/auth/profile') {
    return { firstName: 'Patched' }
  }

  if (method === 'post' && path === '/api/auth/profile/avatar') {
    const img = Buffer.alloc(1400, 1).toString('base64')
    return { imageBase64: `data:image/png;base64,${img}` }
  }

  if (method === 'post' && path === '/api/auth/webauthn/register/start') {
    return { email: 'admin@example.com' }
  }

  if (method === 'post' && path === '/api/auth/webauthn/authenticate/start') {
    return { email: 'admin@example.com' }
  }

  if (method === 'post' && path === '/api/business/profile') {
    return { step: 2, data: { fullName: 'Test Owner' } }
  }

  if (method === 'post' || method === 'patch' || method === 'put') return {}
  return undefined
}

describe('API endpoint smoke tests', () => {
  let mongo
  let app
  let adminToken
  let businessOwnerToken
  let initialAvatarFiles

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'
    process.env.SEED_DEV = 'true'
    process.env.EMAIL_HOST = 'localhost'
    process.env.EMAIL_HOST_USER = 'test'
    process.env.EMAIL_HOST_PASSWORD = 'test'
    process.env.DEFAULT_FROM_EMAIL = 'no-reply@example.com'
    process.env.WEBAUTHN_RPID = 'localhost'
    process.env.WEBAUTHN_ORIGIN = 'http://localhost:3000'

    mongo = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongo.getUri()

    await connectDB(process.env.MONGO_URI)
    await seedDevDataIfEmpty()

    let admin = await User.findOne({ email: 'admin@example.com' }).populate('role')
    let business = await User.findOne({ email: 'business@example.com' }).populate('role')

    // Fallback creation to keep smoke tests stable if seeding skipped
    if (!admin) {
      const adminRole = await Role.findOne({ slug: 'admin' }) || await Role.create({ name: 'Admin', slug: 'admin' })
      admin = await User.create({
        role: adminRole._id,
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        termsAccepted: true,
      })
      admin = await User.findById(admin._id).populate('role')
    }

    if (!business) {
      const boRole = await Role.findOne({ slug: 'business_owner' }) || await Role.create({ name: 'Business Owner', slug: 'business_owner' })
      business = await User.create({
        role: boRole._id,
        firstName: 'Bob',
        lastName: 'Business',
        email: 'business@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        termsAccepted: true,
      })
      business = await User.findById(business._id).populate('role')
    }
    adminToken = signAccessToken(admin).token
    businessOwnerToken = signAccessToken(business).token

    const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars')
    try {
      initialAvatarFiles = new Set(fs.readdirSync(avatarsDir))
    } catch (_) {
      initialAvatarFiles = new Set()
    }

    app = require('../src/index').app
  })

  afterAll(async () => {
    const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars')
    try {
      const current = fs.readdirSync(avatarsDir)
      for (const name of current) {
        if (!initialAvatarFiles.has(name)) {
          try {
            fs.unlinkSync(path.join(avatarsDir, name))
          } catch (_) {}
        }
      }
    } catch (_) {}

    try {
      await mongoose.disconnect()
    } finally {
      if (mongo) await mongo.stop()
    }
  })

  it('responds for every registered route (no 500, not default Express 404)', async () => {
    const routes = uniqRoutes(collectRoutesFromStack(app._router && app._router.stack, ''))
      .filter((r) => !r.path.startsWith('/uploads'))

    for (const r of routes) {
      const isBusiness = r.path.startsWith('/api/business/')
      const token = isBusiness ? businessOwnerToken : adminToken
      let req = request(app)[r.method](r.path).set('Authorization', `Bearer ${token}`)

      if (r.method === 'post' && r.path === '/api/auth/profile/avatar-file') {
        req = req.attach('avatar', Buffer.alloc(1500, 1), 'avatar.png')
      } else {
        const body = bodyForRoute(r.method, r.path)
        if (body !== undefined) req = req.send(body)
      }

      let res
      try {
        res = await req
      } catch (err) {
        const details = `${r.method.toUpperCase()} ${r.path}`
        const e = new Error(`Request failed for ${details}: ${err && err.message ? err.message : String(err)}`)
        e.cause = err
        throw e
      }

      if (res.status === 500 || isDefaultExpress404(res)) {
        // Log failing route for debugging
        console.error(`Endpoint check failed: ${r.method.toUpperCase()} ${r.path} -> ${res.status} ${res.text || ''}`)
      }
      expect(res.status).not.toBe(500)
      expect(isDefaultExpress404(res)).toBe(false)
    }
  })
})
