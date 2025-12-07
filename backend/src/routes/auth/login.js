const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const { generateCode, generateToken } = require('../../lib/codes')
const { loginRequests } = require('../../lib/authRequestsStore')
const LoginRequest = require('../../models/LoginRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')

const router = express.Router()

const loginCredentialsSchema = Joi.object({
  // Support dev admin shorthand: email === '1' with a very short password
  email: Joi.alternatives().try(Joi.string().email(), Joi.string().valid('1')).required(),
  password: Joi.string()
    .max(200)
    .when('email', { is: '1', then: Joi.string().min(1), otherwise: Joi.string().min(6) })
    .required(),
})

const verifyCodeSchema = Joi.object({
  // Allow dev admin shorthand email '1' in verification as well
  email: Joi.alternatives().try(Joi.string().email(), Joi.string().valid('1')).required(),
  // Be forgiving of accidental whitespace
  code: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
})

// Allow disabling or relaxing rate limits in development/testing
const DISABLE_LIMITS = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV !== 'production'
const passthrough = (req, res, next) => next()

const loginStartLimiter = DISABLE_LIMITS
  ? passthrough
  : perEmailRateLimit({
      windowMs: 10 * 60 * 1000,
      max: 5,
      code: 'login_code_rate_limited',
      message: 'Too many login code requests; try again later.',
    })

const loginVerifyLimiter = DISABLE_LIMITS
  ? passthrough
  : perEmailRateLimit({
      windowMs: 10 * 60 * 1000,
      max: 10,
      code: 'login_verify_rate_limited',
      message: 'Too many login verification attempts; try again later.',
    })

// POST /api/auth/login
router.post('/login', validateBody(loginCredentialsSchema), async (req, res) => {
  try {
    const { email, password } = req.body || {}
    // already validated

    // Ensure admin seed for testing if email is "1"
    if (String(email) === '1') {
      let adminDoc = await User.findOne({ email: '1' }).lean()
      if (!adminDoc) {
        const passwordHash = await bcrypt.hash('1', 10)
        const createdAdmin = await User.create({
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: '1',
          phoneNumber: '',
          termsAccepted: true,
          passwordHash,
        })
        adminDoc = await User.findById(createdAdmin._id).lean()
      }
    }

    const doc = await User.findOne({ email }).lean()
    if (!doc || typeof doc.passwordHash !== 'string' || !doc.passwordHash) {
      return respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')
    }
    let match = false
    const isBcrypt = /^\$2[aby]\$/.test(String(doc.passwordHash))
    if (isBcrypt) {
      match = await bcrypt.compare(password, doc.passwordHash)
    } else {
      match = String(password) === String(doc.passwordHash)
      if (match) {
        try {
          const dbDoc = await User.findById(doc._id)
          if (dbDoc) {
            dbDoc.passwordHash = await bcrypt.hash(password, 10)
            await dbDoc.save()
          }
        } catch (_) {}
      }
    }
    if (!match) return respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')
    const safe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
      avatarUrl: doc.avatarUrl || '',
    }
    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login error:', err)
    return respond.error(res, 500, 'login_failed', 'Failed to login')
  }
})

// POST /api/auth/login/start
// Step 1 of two-step login: verify credentials, send verification code
router.post('/login/start', loginStartLimiter, validateBody(loginCredentialsSchema), async (req, res) => {
  try {
    const { email, password } = req.body || {}
    // already validated

    // Ensure admin seed for testing if email is "1"
    if (String(email) === '1') {
      let adminDoc = await User.findOne({ email: '1' }).lean()
      if (!adminDoc) {
        const passwordHash = await bcrypt.hash('1', 10)
        const createdAdmin = await User.create({
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: '1',
          phoneNumber: '',
          termsAccepted: true,
          passwordHash,
        })
        adminDoc = await User.findById(createdAdmin._id).lean()
      }
    }

    const doc = await User.findOne({ email })
    if (!doc || typeof doc.passwordHash !== 'string' || !doc.passwordHash) {
      return respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')
    }
    let match = false
    const isBcrypt = /^\$2[aby]\$/.test(String(doc.passwordHash))
    if (isBcrypt) {
      match = await bcrypt.compare(password, doc.passwordHash)
    } else {
      match = String(password) === String(doc.passwordHash)
      if (match) {
        try {
          doc.passwordHash = await bcrypt.hash(password, 10)
          await doc.save()
        } catch (_) {}
      }
    }
    if (!match) return respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')

    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const loginToken = generateToken()
    const emailKey = String(email).toLowerCase()

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await LoginRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs), verified: false, loginToken, userId: String(doc._id) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      loginRequests.set(emailKey, { code, expiresAt: expiresAtMs, verified: false, loginToken, userId: String(doc._id) })
    }

    const payload = { sent: true }
    if (process.env.NODE_ENV !== 'production') payload.devCode = code
    return res.json(payload)
  } catch (err) {
    console.error('POST /api/auth/login/start error:', err)
    return respond.error(res, 500, 'login_start_failed', 'Failed to start login')
  }
})

// POST /api/auth/login/verify
// Step 2 of two-step login: verify code and complete login
router.post('/login/verify', loginVerifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    if (useDB) {
      reqObj = await LoginRequest.findOne({ email: emailKey }).lean()
      if (!reqObj) return respond.error(res, 404, 'login_request_not_found', 'No login verification request found')
      if (Date.now() > new Date(reqObj.expiresAt).getTime()) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    } else {
      reqObj = loginRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'login_request_not_found', 'No login verification request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    }

    // Load user and return safe object
    const doc = await User.findOne({ email }).lean()
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    const safe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
      avatarUrl: doc.avatarUrl || '',
    }

    // Cleanup login state
    if (useDB) await LoginRequest.deleteOne({ email: emailKey })
    else loginRequests.delete(emailKey)

    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login/verify error:', err)
    return respond.error(res, 500, 'login_verify_failed', 'Failed to verify login code')
  }
})

module.exports = router
