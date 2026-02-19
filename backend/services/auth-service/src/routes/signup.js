const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Role = require('../models/Role')
// Provider-related models removed in unified user flow
const { generateCode } = require('../lib/codes')
const { sendOtp, sendVerificationEmail } = require('../lib/mailer')
const { signUpRequests } = require('../lib/authRequestsStore')
const SignUpRequest = require('../models/SignUpRequest')
const respond = require('../middleware/respond')
const { validateBody, Joi } = require('../middleware/validation')
const { perEmailRateLimit } = require('../middleware/rateLimit')
const { signAccessToken } = require('../middleware/auth')

const router = express.Router()
const BUSINESS_OWNER_ROLE_SLUG = 'business_owner'

const emailWithTld = (value, helpers) => {
  const parts = String(value || '').split('@')
  if (parts.length !== 2) return helpers.error('any.invalid')
  const domain = parts[1]
  if (!domain || domain.indexOf('.') === -1) return helpers.error('any.invalid')
  return value
}

// PIS (Personal Information Sheet) sub-schema — optional at signup, required before first permit
const pisAddressSchema = Joi.object({
  street: Joi.string().trim().max(200).allow('', null),
  barangay: Joi.string().trim().max(100).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  province: Joi.string().trim().max(100).allow('', null),
  zipCode: Joi.string().trim().pattern(/^\d{4}$/).allow('', null),
}).default({})

const signupPayloadSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  middleName: Joi.string().trim().max(100).allow('', null),
  suffix: Joi.string().trim().max(20).allow('', null),
  email: Joi.string().trim().email().custom(emailWithTld, 'require domain TLD').required(),
  phoneNumber: Joi.string().trim().allow('', null),
  password: Joi.string().min(6).max(200).required(), // Min 6 for Joi, actual strength validated separately
  termsAccepted: Joi.boolean().truthy('true', 'TRUE', 'True', 1, '1').valid(true).required(),
  role: Joi.string().valid(BUSINESS_OWNER_ROLE_SLUG).default(BUSINESS_OWNER_ROLE_SLUG),
  // PIS fields (optional at signup)
  address: pisAddressSchema,
  sex: Joi.string().valid('male', 'female').allow('', null),
  maritalStatus: Joi.string().valid('single', 'married', 'widowed', 'divorced', 'separated').allow('', null),
  dateOfBirth: Joi.date().iso().max('now').allow(null),
  placeOfBirth: Joi.string().trim().max(200).allow('', null),
  nationality: Joi.string().trim().max(50).allow('', null),
  spouseName: Joi.string().trim().max(100).allow('', null),
  fatherName: Joi.string().trim().max(100).allow('', null),
  motherName: Joi.string().trim().max(100).allow('', null),
  distinctiveMark: Joi.string().trim().max(200).allow('', null),
  highestEducationalAttainment: Joi.string().valid('elementary', 'high_school', 'vocational', 'college', 'postgraduate').allow('', null),
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
    // Normalize email to match User model's lowercase storage
    const emailKey = String(email || '').toLowerCase().trim()
    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email: emailKey }).lean()
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

// Helper: extract PIS fields from a payload object
function extractPisFields(body) {
  const pis = {}
  if (body.address && typeof body.address === 'object') pis.address = body.address
  if (body.sex) pis.sex = body.sex
  if (body.maritalStatus) pis.maritalStatus = body.maritalStatus
  if (body.dateOfBirth) pis.dateOfBirth = body.dateOfBirth
  if (body.placeOfBirth) pis.placeOfBirth = body.placeOfBirth
  if (body.nationality) pis.nationality = body.nationality
  if (body.spouseName) pis.spouseName = body.spouseName
  if (body.fatherName) pis.fatherName = body.fatherName
  if (body.motherName) pis.motherName = body.motherName
  if (body.distinctiveMark) pis.distinctiveMark = body.distinctiveMark
  if (body.highestEducationalAttainment) pis.highestEducationalAttainment = body.highestEducationalAttainment
  // Mark PIS as completed if all required fields are present
  const hasPis = !!(
    pis.address?.street && pis.address?.barangay && pis.address?.city &&
    pis.address?.province && pis.address?.zipCode &&
    pis.maritalStatus && pis.dateOfBirth && pis.placeOfBirth &&
    pis.nationality && pis.fatherName && pis.motherName &&
    pis.highestEducationalAttainment
  )
  if (hasPis) pis.pisCompleted = true
  return pis
}

// POST /api/auth/signup
router.post('/signup', validateBody(signupPayloadSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      suffix,
      email,
      phoneNumber,
      password,
      termsAccepted,
      role = BUSINESS_OWNER_ROLE_SLUG,
    } = req.body || {}

    // Normalize email to match User model's lowercase storage
    const emailKey = String(email || '').toLowerCase().trim()
    const passwordHash = await bcrypt.hash(password, 10)

    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email: emailKey }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const roleSlug = BUSINESS_OWNER_ROLE_SLUG
    const roleDoc = await Role.findOne({ slug: roleSlug })
    if (!roleDoc) {
      return respond.error(res, 500, 'role_not_configured', 'Business owner role not configured')
    }
    const pisFields = extractPisFields(req.body || {})
    const doc = await User.create({
      role: roleDoc._id,
      firstName,
      lastName,
      middleName: middleName || '',
      suffix: suffix || '',
      email: emailKey,
      phoneNumber: phoneNumber || '',
      termsAccepted: !!termsAccepted,
      passwordHash,
      theme: 'default', // Set default theme for new accounts
      createdBy: 'self',
      ...pisFields,
    })

    const response = {
      user: {
        id: String(doc._id),
        firstName: doc.firstName,
        lastName: doc.lastName,
        middleName: doc.middleName || '',
        suffix: doc.suffix || '',
        sex: doc.sex || '',
        email: doc.email,
        phoneNumber: doc.phoneNumber,
        role: roleSlug,
        termsAccepted: doc.termsAccepted,
        isEmailVerified: !!doc.isEmailVerified,
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

// Middleware to validate password strength before Joi validation
function validatePasswordStrengthMiddleware(req, res, next) {
  // Ensure we have a body object
  if (!req.body) {
    req.body = {}
  }
  
  const password = req.body?.password
  
  // Validate password if it exists
  if (password !== undefined && password !== null) {
    const { validatePasswordStrength } = require('../lib/passwordValidator')
    const passwordValidation = validatePasswordStrength(String(password))
    if (!passwordValidation.valid) {
      // Return weak_password error BEFORE Joi validation can run
      return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
    }
  }
  
  return next()
}

// POST /api/auth/signup/start
// Step 1 for sign-up: collect payload, validate, send verification code
router.post('/signup/start', validatePasswordStrengthMiddleware, validateBody(signupPayloadSchema), checkExistingEmailBeforeLimiter, signupStartLimiter, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      suffix,
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

    const pisFields = extractPisFields(req.body || {})
    const payload = {
      firstName,
      lastName,
      middleName: middleName || '',
      suffix: suffix || '',
      email: emailKey,
      phoneNumber: phoneNumber || '',
      password,
      termsAccepted: !!termsAccepted,
      role: BUSINESS_OWNER_ROLE_SLUG,
      ...pisFields,
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

    const emailResult = await sendOtp({ to: email, code, subject: 'Verify your email' })
    if (!emailResult || !emailResult.success) {
      console.error(`[Signup] Failed to send OTP email to ${email}:`, emailResult?.error || 'Unknown error')
      return respond.error(res, 500, 'email_send_failed', `Failed to send verification email: ${emailResult?.error || 'Please check your email configuration'}`)
    }
    const response = { sent: true }
    if (process.env.NODE_ENV !== 'production') response.devCode = code
    return res.json(response)
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

    const emailResult = await sendOtp({ to: email, code, subject: 'Verify your email' })
    if (!emailResult || !emailResult.success) {
      console.error(`[Signup Resend] Failed to send OTP email to ${email}:`, emailResult?.error || 'Unknown error')
      return respond.error(res, 500, 'email_send_failed', `Failed to send verification email: ${emailResult?.error || 'Please check your email configuration'}`)
    }
    const response = { sent: true }
    if (process.env.NODE_ENV !== 'production') response.devCode = code
    return res.json(response)
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
    const emailKey = String(email).toLowerCase().trim()
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

    // Ensure email is normalized (should already be from payload, but double-check)
    const normalizedEmail = String(p.email || emailKey).toLowerCase().trim()

    // Double-check duplicates at creation time using normalized email
    const existing = await User.findOne({ email: normalizedEmail }).lean()
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
    
    const pisFields = extractPisFields(p)
    const doc = await User.create({
      role: roleDoc._id,
      firstName: p.firstName,
      lastName: p.lastName,
      middleName: p.middleName || '',
      suffix: p.suffix || '',
      email: normalizedEmail,
      phoneNumber: p.phoneNumber || '',
      termsAccepted: !!p.termsAccepted,
      passwordHash,
      theme: 'default', // Set default theme for new accounts
      createdBy: 'self',
      ...pisFields,
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
      middleName: doc.middleName || '',
      suffix: doc.suffix || '',
      sex: doc.sex || '',
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
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

// ── Link Existing Account ──
// For users who already have a permit and want to create a web account linked to their PIS record

const linkExistingSchema = Joi.object({
  email: Joi.string().trim().email().custom(emailWithTld, 'require domain TLD').required(),
  businessPlateNo: Joi.string().trim().max(50).required(),
})

const linkVerifySchema = Joi.object({
  email: Joi.string().trim().email().custom(emailWithTld, 'require domain TLD').required(),
  businessPlateNo: Joi.string().trim().max(50).required(),
  code: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
})

// POST /api/auth/link-existing-account
// Step 1: Search by email + business plate number, send verification code
router.post('/link-existing-account', validateBody(linkExistingSchema), async (req, res) => {
  try {
    const { email, businessPlateNo } = req.body || {}
    const emailKey = String(email || '').toLowerCase().trim()

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: emailKey }).lean()
    if (existingUser) {
      return respond.error(res, 409, 'BUSINESS_ALREADY_LINKED', 'An account with this email already exists. Please log in instead.')
    }

    // Generate verification code and store the link request
    const code = generateCode()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await SignUpRequest.findOneAndUpdate(
        { email: emailKey },
        {
          code,
          expiresAt: new Date(expiresAtMs),
          payload: { email: emailKey, businessPlateNo, linkExisting: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      signUpRequests.set(`link_${emailKey}`, {
        code,
        expiresAt: expiresAtMs,
        payload: { email: emailKey, businessPlateNo, linkExisting: true },
      })
    }

    const emailResult = await sendOtp({ to: email, code, subject: 'Verify your existing account link' })
    if (!emailResult || !emailResult.success) {
      return respond.error(res, 500, 'email_send_failed', 'Failed to send verification email')
    }

    return respond.success(res, 200, { data: { verificationSent: true, expiresIn: ttlMin * 60 } })
  } catch (err) {
    console.error('POST /api/auth/link-existing-account error:', err)
    return respond.error(res, 500, 'link_failed', 'Failed to initiate account linking')
  }
})

// POST /api/auth/link-existing-account/verify
// Step 2: Verify code and create account linked to existing business
router.post('/link-existing-account/verify', validateBody(linkVerifySchema), async (req, res) => {
  try {
    const { email, businessPlateNo, code } = req.body || {}
    const emailKey = String(email || '').toLowerCase().trim()

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    const lookupKey = useDB ? emailKey : `link_${emailKey}`

    if (useDB) {
      reqObj = await SignUpRequest.findOne({ email: emailKey }).lean()
    } else {
      reqObj = signUpRequests.get(lookupKey)
    }

    if (!reqObj) return respond.error(res, 404, 'NOT_FOUND', 'No link request found. Please start again.')
    const expiresAt = useDB ? new Date(reqObj.expiresAt).getTime() : reqObj.expiresAt
    if (Date.now() > expiresAt) return respond.error(res, 400, 'LINK_CODE_EXPIRED', 'Verification code expired')
    if (String(reqObj.code) !== String(code)) return respond.error(res, 400, 'LINK_CODE_INVALID', 'Wrong verification code')

    // Verify the payload matches
    const p = reqObj.payload || {}
    if (!p.linkExisting || p.businessPlateNo !== businessPlateNo) {
      return respond.error(res, 400, 'LINK_CODE_INVALID', 'Request mismatch')
    }

    // Check if email already taken
    const existing = await User.findOne({ email: emailKey }).lean()
    if (existing) {
      if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
      else signUpRequests.delete(lookupKey)
      return respond.error(res, 409, 'BUSINESS_ALREADY_LINKED', 'Account already exists for this email')
    }

    // Create user account (without password — they'll set it up via login flow or password reset)
    // For now, create with a random password; user must use "forgot password" to set their own
    const tempPassword = require('crypto').randomBytes(32).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const roleDoc = await Role.findOne({ slug: BUSINESS_OWNER_ROLE_SLUG })
    if (!roleDoc) {
      return respond.error(res, 500, 'role_not_configured', 'Business owner role not configured')
    }

    const doc = await User.create({
      role: roleDoc._id,
      firstName: 'Pending',
      lastName: 'User',
      email: emailKey,
      passwordHash,
      isEmailVerified: true,
      mustChangeCredentials: true, // Force password setup on first login
      theme: 'default',
      createdBy: 'self',
    })

    // Cleanup
    if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
    else signUpRequests.delete(lookupKey)

    return respond.success(res, 201, {
      data: {
        linked: true,
        userId: String(doc._id),
        message: 'Account linked successfully. Please log in and set your password.',
      },
    })
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'BUSINESS_ALREADY_LINKED', 'Account already exists')
    }
    console.error('POST /api/auth/link-existing-account/verify error:', err)
    return respond.error(res, 500, 'link_verify_failed', 'Failed to verify and link account')
  }
})

module.exports = router

