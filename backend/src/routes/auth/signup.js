const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const Role = require('../../models/Role')
// Provider-related models removed in unified user flow
const { generateCode } = require('../../lib/codes')
const { sendOtp, sendVerificationEmail } = require('../../lib/mailer')
const { signUpRequests } = require('../../lib/authRequestsStore')
const SignUpRequest = require('../../models/SignUpRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')
const { signAccessToken } = require('../../middleware/auth')

const router = express.Router()
const BUSINESS_OWNER_ROLE_SLUG = 'business_owner'

const emailWithTld = (value, helpers) => {
  const parts = String(value || '').split('@')
  if (parts.length !== 2) return helpers.error('any.invalid')
  const domain = parts[1]
  if (!domain || domain.indexOf('.') === -1) return helpers.error('any.invalid')
  return value
}

const signupPayloadSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().custom(emailWithTld, 'require domain TLD').required(),
  phoneNumber: Joi.string().trim().allow('', null),
  password: Joi.string().min(6).max(200).required(),
  termsAccepted: Joi.boolean().truthy('true', 'TRUE', 'True', 1, '1').valid(true).required(),
  role: Joi.string().valid(BUSINESS_OWNER_ROLE_SLUG).default(BUSINESS_OWNER_ROLE_SLUG),
})

const verifyCodeSchema = Joi.object({
  email: Joi.string().trim().email().custom(emailWithTld, 'require domain TLD').required(),
  code: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
})

const signupStartLimiter = perEmailRateLimit({
  windowMs: Number(process.env.VERIFICATION_RESEND_COOLDOWN_SEC || 60) * 1000,
  max: 1,
  code: 'signup_code_rate_limited',
  message: 'You have requested multiple verification codes recently. Please wait and try again later.',
})

const signupVerifyLimiter = perEmailRateLimit({
  windowMs: Number(process.env.VERIFICATION_CODE_TTL_MIN || 10) * 60 * 1000,
  max: Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5),
  code: 'signup_verify_rate_limited',
  message: 'Too many signup verification attempts; try again later.',
})

async function checkExistingEmailBeforeLimiter(req, res, next) {
  try {
    const { email } = req.body || {}
    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')
    return next()
  } catch (err) {
    try {
      const logPath = path.join(process.cwd(), 'backend-error.log')
      const logMsg = `[${new Date().toISOString()}] signup/start checkExistingEmail error: ${err.message}\n${err.stack}\n\n`
      fs.appendFileSync(logPath, logMsg)
    } catch (_) {}
    console.error('signup/start duplicate check error:', err)
    return respond.error(res, 500, 'signup_start_failed', `Failed to start sign up: ${err.message}`)
  }
}

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
      role = BUSINESS_OWNER_ROLE_SLUG,
    } = req.body || {}

    const passwordHash = await bcrypt.hash(password, 10)

    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const roleSlug = BUSINESS_OWNER_ROLE_SLUG
    const roleDoc = await Role.findOne({ slug: roleSlug })
    if (!roleDoc) {
      return respond.error(res, 500, 'role_not_configured', 'Business owner role not configured')
    }
    const doc = await User.create({
      role: roleDoc._id,
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      termsAccepted: !!termsAccepted,
      passwordHash,
      theme: 'default',
      themeColorPrimary: '#003a70',
    })

    const response = {
      user: {
        id: String(doc._id),
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phoneNumber: doc.phoneNumber,
        role: roleSlug,
        termsAccepted: doc.termsAccepted,
        isEmailVerified: !!doc.isEmailVerified,
        theme: doc.theme || 'default',
        themeColorPrimary: doc.themeColorPrimary || '#003a70',
      }
    }

    try {
      // Manually attach role slug for token signing
      const docForToken = doc.toObject()
      docForToken.role = { slug: roleSlug }
      const { token, expiresAtMs } = signAccessToken(docForToken)
      response.user.token = token
      response.user.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

    return respond.success(res, 201, response, 'Account created successfully')
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
router.post('/signup/start', validateBody(signupPayloadSchema), checkExistingEmailBeforeLimiter, signupStartLimiter, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      termsAccepted,
    } = req.body || {}

    const emailKey = String(email).toLowerCase().trim()

    // Prevent duplicates prior to verification
    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email: emailKey }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const payload = {
      firstName,
      lastName,
      email: emailKey,
      phoneNumber: phoneNumber || '',
      password,
      termsAccepted: !!termsAccepted,
      role: BUSINESS_OWNER_ROLE_SLUG,
    }

    const code = generateCode()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000
    // const emailKey = String(email).toLowerCase() // already defined above

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

    // Reset verification attempts since a new code is generated
    if (signupVerifyLimiter.resetKey) {
      signupVerifyLimiter.resetKey(emailKey)
    }

    await sendOtp({ to: email, code, subject: 'Verify your email' })
    return res.json({ sent: true })
  } catch (err) {
    try {
      const logPath = path.join(process.cwd(), 'backend-error.log')
      const logMsg = `[${new Date().toISOString()}] signup/start error: ${err.message}\n${err.stack}\n\n`
      fs.appendFileSync(logPath, logMsg)
    } catch (_) {}
    console.error('POST /api/auth/signup/start error:', err)
    return respond.error(res, 500, 'signup_start_failed', `Failed to start sign up: ${err.message}`)
  }
})

// POST /api/auth/signup/resend
// Resend verification code for an existing signup request
router.post('/signup/resend', validateBody(Joi.object({ email: Joi.string().email().required() })), signupStartLimiter, async (req, res) => {
  try {
    const { email } = req.body || {}
    const emailKey = String(email).toLowerCase().trim()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    
    let reqObj = null
    if (useDB) {
      reqObj = await SignUpRequest.findOne({ email: emailKey })
    } else {
      reqObj = signUpRequests.get(emailKey)
    }

    if (!reqObj) {
      return respond.error(res, 404, 'signup_request_not_found', 'Request expired, please sign up again')
    }

    const code = generateCode()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000

    if (useDB) {
      reqObj.code = code
      reqObj.expiresAt = new Date(expiresAtMs)
      await reqObj.save()
    } else {
      reqObj.code = code
      reqObj.expiresAt = expiresAtMs
      signUpRequests.set(emailKey, reqObj)
    }

    // Reset verification attempts since a new code is generated
    if (signupVerifyLimiter.resetKey) {
      signupVerifyLimiter.resetKey(emailKey)
      console.log(`Reset verification attempts for ${emailKey} (resend)`)
    }

    await sendOtp({ to: email, code, subject: 'Verify your email' })
    return res.json({ sent: true })
  } catch (err) {
    console.error('POST /api/auth/signup/resend error:', err)
    return respond.error(res, 500, 'resend_failed', 'Failed to resend code')
  }
})

// POST /api/auth/signup/verify
// Step 2 for sign-up: verify code and create account
router.post('/signup/verify', validateBody(verifyCodeSchema), signupVerifyLimiter, async (req, res) => {
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
    const roleSlug = BUSINESS_OWNER_ROLE_SLUG
    const roleDoc = await Role.findOne({ slug: roleSlug })
    if (!roleDoc) {
      return respond.error(res, 500, 'role_not_configured', 'Business owner role not configured')
    }
    
    const doc = await User.create({
      role: roleDoc._id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phoneNumber: p.phoneNumber || '',
      termsAccepted: !!p.termsAccepted,
      passwordHash,
      theme: 'default',
      themeColorPrimary: '#003a70',
    })
    
    // Manually attach role slug for token signing
    // doc is a Mongoose document, we can convert to object and attach role
    const docForToken = doc.toObject()
    docForToken.role = { slug: roleSlug } 

    const created = {
      id: String(doc._id),
      role: roleSlug,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      theme: doc.theme || 'default',
      themeColorPrimary: doc.themeColorPrimary || '#003a70',
    }

    try {
      const { token, expiresAtMs } = signAccessToken(docForToken)
      created.token = token
      created.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

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

