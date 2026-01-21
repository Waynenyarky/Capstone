const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const User = require('../../models/User')
const Role = require('../../models/Role')
// Provider-related models removed in unified user flow
const { generateCode } = require('../../lib/codes')
const { sendOtp } = require('../../lib/mailer')
const { signUpRequests } = require('../../lib/authRequestsStore')
const SignUpRequest = require('../../models/SignUpRequest')
const { validatePasswordStrength } = require('../../lib/passwordValidator')
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
  password: Joi.string().min(6).max(200).custom((value, helpers) => {
    // Validate password strength using the same validator as the middleware
    const passwordValidation = validatePasswordStrength(String(value || ''))
    if (!passwordValidation.valid) {
      // Use a special error message format that we can detect
      const errorMsg = `WEAK_PASSWORD_ERROR:${JSON.stringify(passwordValidation.errors)}`
      return helpers.error('any.custom', { message: errorMsg })
    }
    return value
  }).required(),
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
    const doc = await User.create({
      role: roleDoc._id,
      firstName,
      lastName,
      email: emailKey,
      phoneNumber: phoneNumber || '',
      termsAccepted: !!termsAccepted,
      passwordHash,
      theme: 'default', // Set default theme for new accounts
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

// Middleware to validate password strength before other validations
// This MUST run before validateBody to catch weak passwords before Joi validation
function validatePasswordStrengthMiddleware(req, res, next) {
  // Ensure we have a body object
  if (!req.body) {
    req.body = {}
  }
  
  const password = req.body?.password
  
  // Validate password if it exists (check for both undefined and null)
  if (password !== undefined && password !== null) {
    const passwordValidation = validatePasswordStrength(String(password))
    if (!passwordValidation.valid) {
      // Return weak_password error BEFORE Joi validation can run
      return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
    }
  }
  
  // Only call next() if password validation passed or password wasn't provided
  // (If password wasn't provided, let Joi handle the required() validation)
  return next()
}

// POST /api/auth/signup/start
// Step 1 for sign-up: collect payload, validate, send verification code
router.post('/signup/start', validatePasswordStrengthMiddleware, validateBody(signupPayloadSchema), checkExistingEmailBeforeLimiter, signupStartLimiter, async (req, res) => {
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

    console.log(`[Signup Start] Generated OTP code for ${emailKey}: ${code} (expires in ${ttlMin} minutes)`)

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await SignUpRequest.findOneAndUpdate(
        { email: emailKey },
        { code: String(code), expiresAt: new Date(expiresAtMs), payload }, // Ensure code is stored as string
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      console.log(`[Signup Start] Saved signup request to database for ${emailKey}`)
    } else {
      signUpRequests.set(emailKey, { code: String(code), expiresAt: expiresAtMs, payload })
      console.log(`[Signup Start] Saved signup request to memory for ${emailKey}`)
    }

    // Reset verification attempts since a new code is generated
    if (signupVerifyLimiter.resetKey) {
      signupVerifyLimiter.resetKey(emailKey)
    }

    // Send email asynchronously (don't block the response)
    // Return success immediately, then send email in background
    const emailPromise = sendOtp({ to: email, code, subject: 'Verify your email' })
      .then(emailResult => {
        if (!emailResult || !emailResult.success) {
          console.error(`[Signup] Failed to send OTP email to ${email}:`, emailResult?.error || 'Unknown error')
        } else if (emailResult.isMock) {
          console.warn(`[Signup] ⚠️ Mock email used for ${email}. OTP code: ${code}`)
          console.warn(`[Signup] ⚠️ Check backend console logs for the OTP code. Email was NOT actually sent.`)
        } else {
          console.log(`[Signup] ✅ OTP email sent successfully to ${email}`)
        }
      })
      .catch(err => {
        console.error(`[Signup] Error sending OTP email to ${email}:`, err.message)
      })
    
    // Return immediately - email is being sent in background
    return res.json({ sent: true, message: 'Verification code is being sent to your email' })
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

    console.log(`[Signup Resend] Generated new OTP code for ${emailKey}: ${code}`)

    if (useDB) {
      reqObj.code = String(code) // Ensure code is stored as string
      reqObj.expiresAt = new Date(expiresAtMs)
      await reqObj.save()
      console.log(`[Signup Resend] Updated signup request in database for ${emailKey}`)
    } else {
      reqObj.code = String(code) // Ensure code is stored as string
      reqObj.expiresAt = expiresAtMs
      signUpRequests.set(emailKey, reqObj)
      console.log(`[Signup Resend] Updated signup request in memory for ${emailKey}`)
    }

    // Reset verification attempts since a new code is generated
    if (signupVerifyLimiter.resetKey) {
      signupVerifyLimiter.resetKey(emailKey)
      console.log(`Reset verification attempts for ${emailKey} (resend)`)
    }

    console.log(`[Signup Resend] Generated new OTP code for ${emailKey}: ${code}`)

    // Send email asynchronously (don't block the response)
    const emailPromise = sendOtp({ to: email, code, subject: 'Verify your email' })
      .then(emailResult => {
        if (!emailResult || !emailResult.success) {
          console.error(`[Signup Resend] Failed to send OTP email to ${email}:`, emailResult?.error || 'Unknown error')
        } else if (emailResult.isMock) {
          console.warn(`[Signup Resend] ⚠️ Mock email used for ${email}. OTP code: ${code}`)
          console.warn(`[Signup Resend] ⚠️ Check backend console logs for the OTP code. Email was NOT actually sent.`)
        } else {
          console.log(`[Signup Resend] ✅ OTP email sent successfully to ${email}`)
        }
      })
      .catch(err => {
        console.error(`[Signup Resend] Error sending OTP email to ${email}:`, err.message)
      })
    
    // Return immediately - email is being sent in background
    return res.json({ sent: true, message: 'Verification code is being sent to your email' })
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
    
    console.log(`[Signup Verify] Attempting verification for ${emailKey} with code: ${code} (type: ${typeof code})`)
    
    let reqObj = null
    if (useDB) {
      reqObj = await SignUpRequest.findOne({ email: emailKey }).lean()
      if (!reqObj) {
        console.log(`[Signup Verify] No signup request found for ${emailKey}`)
        return respond.error(res, 404, 'signup_request_not_found', 'No signup request found. Please request a new verification code.')
      }
      
      // Normalize codes for comparison - handle both string and number types
      const storedCodeRaw = reqObj.code
      const storedCode = String(storedCodeRaw || '').trim().replace(/\s+/g, '')
      const receivedCode = String(code || '').trim().replace(/\s+/g, '')
      const expiresAt = new Date(reqObj.expiresAt).getTime()
      const now = Date.now()
      
      console.log(`[Signup Verify] Raw stored code: ${JSON.stringify(storedCodeRaw)} (type: ${typeof storedCodeRaw})`)
      console.log(`[Signup Verify] Normalized stored code: "${storedCode}"`)
      console.log(`[Signup Verify] Received code: "${receivedCode}"`)
      console.log(`[Signup Verify] Codes match: ${storedCode === receivedCode}`)
      console.log(`[Signup Verify] Expires at: ${new Date(expiresAt).toISOString()}, Now: ${new Date(now).toISOString()}`)
      console.log(`[Signup Verify] Time remaining: ${Math.floor((expiresAt - now) / 1000)} seconds`)
      
      if (now > expiresAt) {
        console.log(`[Signup Verify] Code expired for ${emailKey}`)
        return respond.error(res, 410, 'code_expired', 'Code expired. Please request a new verification code.')
      }
      
      if (storedCode !== receivedCode) {
        console.log(`[Signup Verify] ❌ Code mismatch for ${emailKey}`)
        console.log(`[Signup Verify] Expected: "${storedCode}" (length: ${storedCode.length})`)
        console.log(`[Signup Verify] Got: "${receivedCode}" (length: ${receivedCode.length})`)
        console.log(`[Signup Verify] Character-by-character comparison:`)
        for (let i = 0; i < Math.max(storedCode.length, receivedCode.length); i++) {
          const sChar = storedCode[i] || '(missing)'
          const rChar = receivedCode[i] || '(missing)'
          if (sChar !== rChar) {
            console.log(`[Signup Verify]   Position ${i}: stored="${sChar}" (${sChar.charCodeAt(0)}) vs received="${rChar}" (${rChar.charCodeAt(0)})`)
          }
        }
        return respond.error(res, 401, 'invalid_code', 'Invalid verification code. Please check and try again.')
      }
    } else {
      reqObj = signUpRequests.get(emailKey)
      if (!reqObj) {
        console.log(`[Signup Verify] No signup request found in memory for ${emailKey}`)
        return respond.error(res, 404, 'signup_request_not_found', 'No signup request found. Please request a new verification code.')
      }
      
      // Normalize codes for comparison
      const storedCodeRaw = reqObj.code
      const storedCode = String(storedCodeRaw || '').trim().replace(/\s+/g, '')
      const receivedCode = String(code || '').trim().replace(/\s+/g, '')
      const now = Date.now()
      
      console.log(`[Signup Verify] Raw stored code: ${JSON.stringify(storedCodeRaw)} (type: ${typeof storedCodeRaw})`)
      console.log(`[Signup Verify] Normalized stored code: "${storedCode}"`)
      console.log(`[Signup Verify] Received code: "${receivedCode}"`)
      console.log(`[Signup Verify] Codes match: ${storedCode === receivedCode}`)
      console.log(`[Signup Verify] Expires at: ${new Date(reqObj.expiresAt).toISOString()}, Now: ${new Date(now).toISOString()}`)
      console.log(`[Signup Verify] Time remaining: ${Math.floor((reqObj.expiresAt - now) / 1000)} seconds`)
      
      if (now > reqObj.expiresAt) {
        console.log(`[Signup Verify] Code expired for ${emailKey}`)
        return respond.error(res, 410, 'code_expired', 'Code expired. Please request a new verification code.')
      }
      
      if (storedCode !== receivedCode) {
        console.log(`[Signup Verify] ❌ Code mismatch for ${emailKey}`)
        console.log(`[Signup Verify] Expected: "${storedCode}" (length: ${storedCode.length})`)
        console.log(`[Signup Verify] Got: "${receivedCode}" (length: ${receivedCode.length})`)
        return respond.error(res, 401, 'invalid_code', 'Invalid verification code. Please check and try again.')
      }
    }
    
    console.log(`[Signup Verify] ✅ Code verified successfully for ${emailKey}`)

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
    
    const doc = await User.create({
      role: roleDoc._id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: normalizedEmail,
      phoneNumber: p.phoneNumber || '',
      termsAccepted: !!p.termsAccepted,
      passwordHash,
      theme: 'default', // Set default theme for new accounts
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

