const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const Role = require('../../models/Role')
const { generateCode, generateToken } = require('../../lib/codes')
const { sendOtp } = require('../../lib/mailer')
const { loginRequests } = require('../../lib/authRequestsStore')
const { signAccessToken } = require('../../middleware/auth')
const LoginRequest = require('../../models/LoginRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')
const { decryptWithHash } = require('../../lib/secretCipher')
let OAuth2Client = null
try { ({ OAuth2Client } = require('google-auth-library')) } catch (_) { OAuth2Client = null }

const router = express.Router()

function displayPhoneNumber(value) {
  const s = typeof value === 'string' ? value : ''
  if (s.startsWith('__unset__')) return ''
  return s
}

function normalizeLoginIdentifier(raw) {
  return String(raw || '').toLowerCase().trim()
}

function isEmailIdentifier(identifier) {
  if (identifier === '1') return true
  return identifier.includes('@')
}

async function findUserByIdentifier(identifier, { populateRole = false, lean = true } = {}) {
  const key = normalizeLoginIdentifier(identifier)
  const query = isEmailIdentifier(key) ? { email: key } : { username: key }
  let q = User.findOne(query)
  if (populateRole) q = q.populate('role')
  if (lean) q = q.lean()
  const doc = await q
  const emailKey = doc && doc.email ? String(doc.email).toLowerCase().trim() : ''
  return { doc, emailKey }
}

const loginCredentialsSchema = Joi.object({
  // Support dev admin shorthand: email === '1' with a very short password
  email: Joi.string().trim().min(1).max(200).required(),
  password: Joi.string()
    .max(200)
    .when('email', { is: '1', then: Joi.string().min(1), otherwise: Joi.string().min(6) })
    .required(),
})

const verifyCodeSchema = Joi.object({
  // Allow dev admin shorthand email '1' in verification as well
  email: Joi.string().trim().min(1).max(200).required(),
  // Be forgiving of accidental whitespace
  code: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
})

const verifyTotpSchema = Joi.object({
  email: Joi.string().trim().min(1).max(200).required(),
  code: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
})

const googleLoginSchema = Joi.object({
  idToken: Joi.string().min(10),
  email: Joi.string().email(),
  providerId: Joi.string().min(5),
  emailVerified: Joi.boolean(),
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
}).or('idToken', 'email')

const resendCodeSchema = Joi.object({
  email: Joi.alternatives().try(Joi.string().email(), Joi.string().valid('1')).required(),
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

// POST /api/auth/login/start
// Step 1 of two-step login: validate credentials, send verification code
// Also handles '1' shorthand for dev admin
router.post('/login/start', loginStartLimiter, validateBody(loginCredentialsSchema), async (req, res) => {
  try {
    let { email, password } = req.body || {}
    const bypass = String(req.headers['x-bypass-fingerprint'] || '').toLowerCase() === 'true'
    // already validated

    const identifier = normalizeLoginIdentifier(email)

    // Ensure admin seed for testing if email is "1"
    if (String(identifier) === '1') {
      let adminDoc = await User.findOne({ email: '1' }).lean()
      if (!adminDoc) {
        const passwordHash = await bcrypt.hash('1', 10)
        const adminRole = await Role.findOne({ slug: 'admin' })
        const createdAdmin = await User.create({
          role: adminRole ? adminRole._id : undefined,
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

    // Use manual populate to handle potential schema mismatches
    let doc = await User.findOne({ email }).lean()
    if (doc && doc.role && typeof doc.role === 'string' && !mongoose.Types.ObjectId.isValid(doc.role)) {
       // Auto-fix bad role data
       try {
         const r = await Role.findOne({ slug: doc.role }).lean()
         if (r) {
           await User.updateOne({ _id: doc._id }, { role: r._id })
           doc.role = r
         }
       } catch (_) {}
    } else if (doc && doc.role) {
       doc.role = await Role.findById(doc.role).lean()
    }

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
          // doc is plain object, need to find doc to save
          const dbDoc = await User.findById(doc._id)
          if (dbDoc) {
            dbDoc.passwordHash = await bcrypt.hash(password, 10)
            await dbDoc.save()
          }
        } catch (_) {}
      }
    }
    if (!match) return respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')

    const emailKey = String(doc.email).toLowerCase().trim()

    // Special handling for LGU Officer: Fixed OTP, no email
    const isLguOfficer = doc.role && doc.role.slug === 'lgu_officer'
    const code = isLguOfficer ? '123456' : generateCode()
    
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const loginToken = generateToken()

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

    try {
      // Send verification code via email if no MFA or if this is part of the flow
      // Skip email for LGU Officer
      if (!doc.mfaEnabled && !isLguOfficer) {
        await sendOtp({ to: email, code, subject: 'Your Login Verification Code' })
      } else if (isLguOfficer) {
        console.log(`[LGU Officer Login] Email suppressed. Use fixed OTP: ${code}`)
      }
    } catch (mailErr) {
      console.error('Failed to send login verification email:', mailErr)
      // Don't block login, but log it. Frontend might need to handle this.
    }

    const payload = { sent: true }
    payload.mfaEnabled = doc.mfaEnabled === true
    try {
      const hasTotp = !!doc.mfaSecret
      let method = String(doc.mfaMethod || '').toLowerCase()
      if (!method) {
        if (hasTotp) method = 'authenticator'
        else if (doc.fprintEnabled) method = 'fingerprint'
      }
      payload.mfaMethod = method
      payload.isFingerprintEnabled = !!doc.fprintEnabled || method.includes('fingerprint')
    } catch (_) {}
    payload.loginEmail = emailKey
    if (process.env.NODE_ENV !== 'production') payload.devCode = code
    return res.json(payload)
  } catch (err) {
    console.error('POST /api/auth/login/start error:', err)
    return respond.error(res, 500, 'login_start_failed', `Failed to start login: ${err.message}`)
  }
})

// POST /api/auth/login/resend
// Resend verification code for an existing login request
router.post('/login/resend', loginStartLimiter, validateBody(resendCodeSchema), async (req, res) => {
  try {
    const { email } = req.body || {}
    const emailKey = String(email).toLowerCase().trim()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    
    if (useDB) {
      reqObj = await LoginRequest.findOne({ email: emailKey }).lean()
    } else {
      reqObj = loginRequests.get(emailKey)
    }

    if (!reqObj) return respond.error(res, 404, 'request_not_found', 'No pending login request found. Please log in again.')
    
    // Allow resending even if expired, but update expiration. 
    // Or if strictly expired, force login again. 
    // Let's force login again if expired significantly, but here we just refresh it.
    // Actually, if it's expired, the record might be gone if we had TTL, but we handle it manually.
    
    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes refreshed
    
    if (useDB) {
      await LoginRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs) }
      )
    } else {
      reqObj.code = code
      reqObj.expiresAt = expiresAtMs
      loginRequests.set(emailKey, reqObj)
    }

    try {
      await sendOtp({ to: email, code, subject: 'Your Login Verification Code (Resend)' })
    } catch (mailErr) {
      console.error('Failed to resend login email:', mailErr)
      return respond.error(res, 500, 'email_failed', 'Failed to send email')
    }

    return res.json({ sent: true })
  } catch (err) {
    console.error('POST /api/auth/login/resend error:', err)
    return respond.error(res, 500, 'resend_failed', 'Failed to resend code')
  }
})

// POST /api/auth/login/verify
// Step 2 of two-step login: verify code and complete login
router.post('/login/verify', loginVerifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    let { email, code } = req.body || {}
    const identifier = normalizeLoginIdentifier(email)
    const { doc: userDoc, emailKey } = await findUserByIdentifier(identifier, { populateRole: true, lean: true })
    if (!userDoc) return respond.error(res, 404, 'user_not_found', 'User not found')
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
    // Use manual populate to handle potential schema mismatches (e.g. role as string "admin")
    let doc = await User.findOne({ email: emailKey }).lean()
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    // Auto-fix for legacy/bad data where role is a string slug instead of ObjectId
    if (doc.role && typeof doc.role === 'string' && !mongoose.Types.ObjectId.isValid(doc.role)) {
      try {
        const slug = doc.role
        const roleDoc = await Role.findOne({ slug }).lean()
        if (roleDoc) {
          console.log(`[Auto-Fix] Updating user ${doc.email} role from "${slug}" to ObjectId(${roleDoc._id})`)
          await User.updateOne({ _id: doc._id }, { role: roleDoc._id })
          doc.role = roleDoc
        }
      } catch (err) {
        console.warn('Failed to auto-fix user role:', err)
      }
    } else if (doc.role) {
      // Manual populate
      doc.role = await Role.findById(doc.role).lean()
    }
    
    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'

    const safe = {
      id: String(doc._id),
      role: roleSlug,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: displayPhoneNumber(doc.phoneNumber),
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
      avatarUrl: doc.avatarUrl || '',
      username: doc.username || '',
      office: doc.office || '',
      isActive: doc.isActive !== false,
      isStaff: !!doc.isStaff,
      mustChangeCredentials: !!doc.mustChangeCredentials,
      mustSetupMfa: !!doc.mustSetupMfa,
    }
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

    // Cleanup login state
    if (useDB) await LoginRequest.deleteOne({ email: emailKey })
    else loginRequests.delete(emailKey)

    return res.json(safe)
  } catch (err) {
    try {
      const logPath = path.join(process.cwd(), 'backend-error.log')
      const logMsg = `[${new Date().toISOString()}] login/verify error: ${err.message}\n${err.stack}\n\n`
      fs.appendFileSync(logPath, logMsg)
    } catch (_) {}
    console.error('POST /api/auth/login/verify error:', err)
    return respond.error(res, 500, 'login_verify_failed', `Failed to verify login code: ${err.message}`)
  }
})

// POST /api/auth/login/verify-totp
router.post('/login/verify-totp', validateBody(verifyTotpSchema), async (req, res) => {
  try {
    let { email, code } = req.body || {}
    const identifier = normalizeLoginIdentifier(email)
    const { doc, emailKey } = await findUserByIdentifier(identifier, { populateRole: true, lean: false })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (doc.mfaEnabled !== true || !doc.mfaSecret) {
      return respond.error(res, 400, 'mfa_not_enabled', 'MFA is not enabled for this account')
    }

  const { verifyTotpWithCounter } = require('../../lib/totp')
  const secretPlain = decryptWithHash(String(doc.passwordHash || ''), String(doc.mfaSecret))
  const resVerify = verifyTotpWithCounter({ secret: secretPlain, token: String(code), window: 1, period: 30, digits: 6 })
  if (!resVerify.ok) return respond.error(res, 401, 'invalid_mfa_code', 'Invalid verification code')
  if (typeof doc.mfaLastUsedTotpCounter === 'number' && doc.mfaLastUsedTotpCounter === resVerify.counter) {
    return respond.error(res, 401, 'totp_replayed', 'Verification code already used')
  }
  doc.mfaMethod = doc.fprintEnabled ? 'authenticator,fingerprint' : 'authenticator'
  doc.mfaLastUsedTotpCounter = resVerify.counter
  doc.mfaLastUsedTotpAt = new Date()
  await doc.save()

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'

    const safe = {
      id: String(doc._id),
      role: roleSlug,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: displayPhoneNumber(doc.phoneNumber),
      avatarUrl: doc.avatarUrl || '',
      termsAccepted: doc.termsAccepted,
      deletionPending: !!doc.deletionPending,
      deletionScheduledFor: doc.deletionScheduledFor,
      createdAt: doc.createdAt,
      username: doc.username || '',
      office: doc.office || '',
      isActive: doc.isActive !== false,
      isStaff: !!doc.isStaff,
      mustChangeCredentials: !!doc.mustChangeCredentials,
      mustSetupMfa: !!doc.mustSetupMfa,
    }
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}
    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login/verify-totp error:', err)
    return respond.error(res, 500, 'totp_failed', 'Failed to verify TOTP')
  }
})

// POST /api/auth/google
// Exchange Google ID Token for session
router.post('/google', validateBody(googleLoginSchema), async (req, res) => {
  try {
    const { idToken, email, providerId, emailVerified, firstName, lastName } = req.body || {}
    let finalEmail = email
    let finalSub = providerId

    // Verify ID token if provided
    if (idToken && OAuth2Client) {
      try {
        const client = new OAuth2Client()
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
        const payload = ticket.getPayload()
        if (payload) {
          finalEmail = payload.email
          finalSub = payload.sub
        }
      } catch (e) {
        console.error('Google ID Token verification failed:', e)
        return respond.error(res, 401, 'invalid_token', 'Invalid Google ID Token')
      }
    }
    
    if (!finalEmail) return respond.error(res, 400, 'email_required', 'Email is required')

    const emailKey = String(finalEmail).toLowerCase().trim()
    let doc = await User.findOne({ email: emailKey }).populate('role')
    
    if (!doc) {
      // Create new user via Google
      const roleSlug = 'user'
      let roleDoc = await Role.findOne({ slug: roleSlug })
      if (!roleDoc) roleDoc = await Role.findOne({ slug: 'user' })

      const passwordHash = await bcrypt.hash(generateCode(16), 10) // random password
      doc = await User.create({
        role: roleDoc ? roleDoc._id : undefined,
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        email: emailKey,
        phoneNumber: '',
        termsAccepted: true,
        passwordHash,
        authProvider: 'google',
        providerId: finalSub,
        isEmailVerified: true, // Google verified
      })
      // Reload to populate role
      doc = await User.findById(doc._id).populate('role')
    } else {
      // Update existing user
      if (!doc.authProvider) {
        doc.authProvider = 'google'
        doc.providerId = finalSub
      }
      doc.isEmailVerified = true
      doc.lastLoginAt = new Date()
      await doc.save()
    }

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    const safe = {
      id: String(doc._id),
      role: roleSlug,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: displayPhoneNumber(doc.phoneNumber),
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      avatarUrl: doc.avatarUrl || '',
      username: doc.username || '',
      office: doc.office || '',
      isActive: doc.isActive !== false,
      isStaff: !!doc.isStaff,
      mustChangeCredentials: !!doc.mustChangeCredentials,
      mustSetupMfa: !!doc.mustSetupMfa,
    }
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/google error:', err)
    return respond.error(res, 500, 'google_login_failed', 'Failed to login with Google')
  }
})

module.exports = router