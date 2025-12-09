const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
// Provider-related models removed in unified user flow
const { generateCode } = require('../../lib/codes')
const { signUpRequests } = require('../../lib/authRequestsStore')
const SignUpRequest = require('../../models/SignUpRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')

const router = express.Router()

const signupPayloadSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().allow('', null),
  password: Joi.string().min(6).max(200).required(),
  termsAccepted: Joi.boolean().truthy('true', 'TRUE', 'True', 1, '1').valid(true).required(),
  role: Joi.string().valid('user').default('user'),
})

const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

const signupStartLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  code: 'signup_code_rate_limited',
  message: 'Too many signup code requests; try again later.',
})

const signupVerifyLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  code: 'signup_verify_rate_limited',
  message: 'Too many signup verification attempts; try again later.',
})

// POST /api/auth/signup
router.post('/signup', validateBody(signupPayloadSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      termsAccepted,
      role = 'user',
    } = req.body || {}

    const passwordHash = await bcrypt.hash(password, 10)

    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const doc = await User.create({
      role: role || 'user',
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      termsAccepted: !!termsAccepted,
      passwordHash,
    })

    const created = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }

    return res.status(201).json(created)
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }
    console.error('POST /api/auth/signup error:', err)
    return respond.error(res, 500, 'signup_failed', 'Failed to sign up')
  }
})

// POST /api/auth/signup/start
// Step 1 for sign-up: collect payload, validate, send verification code
router.post('/signup/start', signupStartLimiter, validateBody(signupPayloadSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      termsAccepted,
      role = 'user',
    } = req.body || {}

    // Prevent duplicates prior to verification
    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const payload = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      password,
      termsAccepted: !!termsAccepted,
      role: role || 'user',
    }

    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const emailKey = String(email).toLowerCase()

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await SignUpRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs), payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      signUpRequests.set(emailKey, { code, expiresAt: expiresAtMs, payload })
    }

    const out = { sent: true }
    if (process.env.NODE_ENV !== 'production') out.devCode = code
    return res.json(out)
  } catch (err) {
    console.error('POST /api/auth/signup/start error:', err)
    return respond.error(res, 500, 'signup_start_failed', 'Failed to start sign up')
  }
})

// POST /api/auth/signup/verify
// Step 2 for sign-up: verify code and create account
router.post('/signup/verify', signupVerifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    if (useDB) {
      reqObj = await SignUpRequest.findOne({ email: emailKey }).lean()
      if (!reqObj) return respond.error(res, 404, 'signup_request_not_found', 'No signup request found')
      if (Date.now() > new Date(reqObj.expiresAt).getTime()) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    } else {
      reqObj = signUpRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'signup_request_not_found', 'No signup request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    }

    const p = reqObj.payload || {}

    // Double-check duplicates at creation time
    const existing = await User.findOne({ email: p.email }).lean()
    if (existing) {
      // Cleanup pending state
      if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
      else signUpRequests.delete(emailKey)
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }

    const passwordHash = await bcrypt.hash(p.password, 10)
    const doc = await User.create({
      role: p.role || 'user',
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phoneNumber: p.phoneNumber || '',
      termsAccepted: !!p.termsAccepted,
      passwordHash,
    })
    const created = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }

    // Cleanup pending state
    if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
    else signUpRequests.delete(emailKey)
    return res.status(201).json(created)
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }
    console.error('POST /api/auth/signup/verify error:', err)
    return respond.error(res, 500, 'signup_verify_failed', 'Failed to verify signup')
  }
})

module.exports = router
