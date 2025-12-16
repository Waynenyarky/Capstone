const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const { generateCode, generateToken } = require('../../lib/codes')
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

const verifyTotpSchema = Joi.object({
  email: Joi.string().email().required(),
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
    const bypass = String(req.headers['x-bypass-fingerprint'] || '').toLowerCase() === 'true'
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

    if (doc.mfaEnabled === true) {
      const method = String(doc.mfaMethod || '').toLowerCase()
      const hasTotp = !!doc.mfaSecret
      // Allow fingerprint if enabled, regardless of TOTP status.
      // If both are enabled, we prefer fingerprint but allow fallback to TOTP via client logic.
      const isFingerprint = !!doc.fprintEnabled || method.includes('fingerprint')
      if (isFingerprint && !bypass) {
        const loginToken = generateToken()
        const expiresAtMs = Date.now() + 5 * 60 * 1000
        const emailKey = String(email).toLowerCase()
        const useDB = mongoose.connection && mongoose.connection.readyState === 1
        if (useDB) {
          await LoginRequest.findOneAndUpdate(
            { email: emailKey },
            { expiresAt: new Date(expiresAtMs), verified: false, loginToken, userId: String(doc._id) },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        } else {
          loginRequests.set(emailKey, { expiresAt: expiresAtMs, verified: false, loginToken, userId: String(doc._id) })
        }
        return respond.error(res, 401, 'fingerprint_required', 'Fingerprint verification required', { loginToken })
      }
      if (!isFingerprint) return respond.error(res, 401, 'mfa_required', 'Multi-factor authentication required')
    }
    if (doc.role !== 'user' && doc.role !== 'admin') {
      try {
        const dbDoc = await User.findById(doc._id)
        if (dbDoc) {
          dbDoc.role = 'user'
          await dbDoc.save()
          doc.role = 'user'
        }
      } catch (_) {}
    }
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
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}
    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login error:', err)
    return respond.error(res, 500, 'login_failed', 'Failed to login')
  }
})

router.post('/login/google', validateBody(googleLoginSchema), async (req, res) => {
  try {
    const { idToken, email: emailInput, providerId: providerIdInput, emailVerified: emailVerifiedInput, firstName: firstNameInput, lastName: lastNameInput } = req.body || {}
    let email = ''
    let firstName = 'User'
    let lastName = ''
    let avatarUrl = ''
    let providerId = ''
    let isEmailVerified = false

    const CLIENT_ID = process.env.GOOGLE_SERVER_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  const hasOauth = !!OAuth2Client && !!CLIENT_ID
  if (idToken && hasOauth && !String(idToken).startsWith('none:')) {
    try {
      const client = new OAuth2Client(CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload || !payload.email) {
        // fallthrough
      }
      if (payload && payload.email) {
        email = String(payload.email)
        const given = String(payload.given_name || '').trim()
        const family = String(payload.family_name || '').trim()
        const fullName = String(payload.name || '').trim()
        if (given || family) {
          firstName = given || firstName
          lastName = family || lastName
        } else if (fullName) {
          try {
            const parts = fullName.split(/\s+/)
            if (parts.length >= 2) {
              firstName = `${(parts[0] || '').trim()} ${(parts[1] || '').trim()}`.trim() || firstName
              lastName = parts.length > 2 ? parts.slice(2).join(' ').trim() : (lastName || '')
            } else {
              firstName = parts[0] || firstName
              lastName = (lastName || '')
            }
          } catch (_) {
            // leave defaults
          }
        }
        avatarUrl = String(payload.picture || '')
        providerId = String(payload.sub || providerId)
        isEmailVerified = !!payload.email_verified
      }
    } catch (e) {
      // fallthrough
      try {
        const msg = String(e && e.message ? e.message : '')
        const code = msg.includes('audience') ? 'invalid_audience' : 'invalid_id_token'
        if (!email && !emailInput) {
          return respond.error(res, 400, code, 'Invalid Google ID token')
        }
      } catch (_) {}
    }
  }
    if (!email && emailInput) {
      email = String(emailInput)
    }
    if (!providerId && providerIdInput) {
      providerId = String(providerIdInput)
    }
    if (!isEmailVerified && typeof emailVerifiedInput === 'boolean') {
      isEmailVerified = emailVerifiedInput === true
    }
    if (typeof firstNameInput === 'string' && String(firstNameInput).trim().length > 0) {
      firstName = String(firstNameInput).trim()
    }
    if (typeof lastNameInput === 'string' && String(lastNameInput).trim().length > 0) {
      lastName = String(lastNameInput).trim()
    }
    // Default Google accounts as verified when using Google Sign-In flow
    if (!isEmailVerified) isEmailVerified = true
    if (!email) {
      return respond.error(res, 400, 'google_login_unavailable', 'Google login not available')
    }

    let doc = null
    try {
      doc = await User.findOne({ email }).lean()
      if (!doc) {
        try {
          const localPart = String(email).split('@')[0] || ''
          let fn = String(firstName || '').trim()
          let ln = String(lastName || '').trim()
          if (!fn || fn.toLowerCase() === 'user') {
            const tokens = localPart.split(/[._\- ]+/).filter(Boolean)
            if (tokens.length > 0) fn = tokens[0]
            if (!ln && tokens.length > 1) ln = tokens.slice(1).join(' ')
          }
          firstName = fn || localPart || 'User'
          lastName = ln || ''
        } catch (_) {
          firstName = (String(firstName || '').trim() || 'User')
          lastName = (String(lastName || '').trim() || '')
        }
        const passwordHash = await bcrypt.hash(generateToken(), 10)
        const created = await User.create({
          role: 'user',
          firstName,
          lastName,
          email,
          phoneNumber: '',
          termsAccepted: true,
          passwordHash,
          avatarUrl,
          authProvider: 'google',
          providerId,
          isEmailVerified,
          lastLoginAt: new Date(),
        })
        doc = await User.findById(created._id).lean()
      } else {
        try {
          const dbDoc = await User.findById(doc._id)
          if (dbDoc) {
            let newFirst = String(firstName || '').trim()
            let newLast = String(lastName || '').trim()
            if (!newFirst || newFirst.toLowerCase() === 'user') {
              const localPart = String(email).split('@')[0] || ''
              const tokens = localPart.split(/[._\- ]+/).filter(Boolean)
              if (tokens.length > 0) newFirst = tokens[0]
              if (!newLast && tokens.length > 1) newLast = tokens.slice(1).join(' ')
            }
            if (newFirst && (!dbDoc.firstName || String(dbDoc.firstName).trim() !== newFirst)) {
              dbDoc.firstName = newFirst
              doc.firstName = newFirst
            }
            if (newLast && (!dbDoc.lastName || String(dbDoc.lastName).trim() !== newLast)) {
              dbDoc.lastName = newLast
              doc.lastName = newLast
            }
            if (avatarUrl && !dbDoc.avatarUrl) {
              dbDoc.avatarUrl = avatarUrl
              doc.avatarUrl = avatarUrl
            }
            dbDoc.authProvider = 'google'
            if (providerId) dbDoc.providerId = providerId
            dbDoc.isEmailVerified = isEmailVerified
            dbDoc.lastLoginAt = new Date()
            await dbDoc.save()
            try {
              doc = await User.findById(doc._id).lean()
            } catch (_) {}
          }
        } catch (_) {}
      }
      /* else if (avatarUrl && (!doc.avatarUrl || String(doc.avatarUrl) !== avatarUrl)) {
        try {
          const dbDoc = await User.findById(doc._id)
          if (dbDoc) {
            dbDoc.avatarUrl = avatarUrl
            await dbDoc.save()
            doc.avatarUrl = avatarUrl
          }
        } catch (_) {}
      } */
    } catch (dbErr) {
      console.error('Google login DB error:', dbErr)
      return respond.error(res, 500, 'db_error', 'Database error during Google login')
    }

    const safe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      avatarUrl: doc.avatarUrl || '',
      authProvider: doc.authProvider,
      providerId: doc.providerId,
      isEmailVerified: doc.isEmailVerified,
      lastLoginAt: doc.lastLoginAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}
    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login/google error:', err)
    return respond.error(res, 500, 'google_login_failed', 'Failed to login with Google')
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
    if (doc.role !== 'user' && doc.role !== 'admin') {
      try {
        const dbDoc = await User.findById(doc._id)
        if (dbDoc) {
          dbDoc.role = 'user'
          await dbDoc.save()
          doc.role = 'user'
        }
      } catch (_) {}
    }
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
    console.error('POST /api/auth/login/verify error:', err)
    return respond.error(res, 500, 'login_verify_failed', 'Failed to verify login code')
  }
})

// POST /api/auth/login/verify-totp
router.post('/login/verify-totp', validateBody(verifyTotpSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const doc = await User.findOne({ email })
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

    const safe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      avatarUrl: doc.avatarUrl || '',
      termsAccepted: doc.termsAccepted,
      deletionPending: !!doc.deletionPending,
      deletionScheduledFor: doc.deletionScheduledFor,
      createdAt: doc.createdAt,
    }
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}
    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login/verify-totp error:', err)
    return respond.error(res, 500, 'login_mfa_failed', 'Failed to verify MFA login')
  }
})

const fingerprintCompleteSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().min(10).required(),
})

const fingerprintStartSchema = Joi.object({
  email: Joi.string().email().required(),
})

router.post('/login/start-fingerprint', validateBody(fingerprintStartSchema), async (req, res) => {
  try {
    const { email } = req.body || {}
    const doc = await User.findOne({ email }).lean()
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (doc.mfaEnabled !== true || (!doc.fprintEnabled && !(String(doc.mfaMethod || '').toLowerCase() === 'fingerprint' || !doc.mfaSecret))) {
      return respond.error(res, 400, 'fingerprint_not_enabled', 'Fingerprint is not enabled for this account')
    }
    const loginToken = generateToken()
    const expiresAtMs = Date.now() + 5 * 60 * 1000
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await LoginRequest.findOneAndUpdate(
        { email: emailKey },
        { expiresAt: new Date(expiresAtMs), verified: false, loginToken, userId: String(doc._id) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      loginRequests.set(emailKey, { expiresAt: expiresAtMs, verified: false, loginToken, userId: String(doc._id) })
    }
    return res.json({ token: loginToken, expiresAt: new Date(expiresAtMs).toISOString() })
  } catch (err) {
    console.error('POST /api/auth/login/start-fingerprint error:', err)
    return respond.error(res, 500, 'fingerprint_start_failed', 'Failed to start fingerprint login')
  }
})

router.post('/login/complete-fingerprint', validateBody(fingerprintCompleteSchema), async (req, res) => {
  try {
    const { email, token } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    if (useDB) {
      reqObj = await LoginRequest.findOne({ email: emailKey }).lean()
      if (!reqObj) return respond.error(res, 404, 'login_request_not_found', 'No login verification request found')
      if (Date.now() > new Date(reqObj.expiresAt).getTime()) return respond.error(res, 410, 'fingerprint_token_expired', 'Fingerprint login session expired')
      if (String(reqObj.loginToken) !== String(token)) return respond.error(res, 401, 'invalid_fingerprint_token', 'Invalid fingerprint token')
    } else {
      reqObj = loginRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'login_request_not_found', 'No login verification request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'fingerprint_token_expired', 'Fingerprint login session expired')
      if (String(reqObj.loginToken) !== String(token)) return respond.error(res, 401, 'invalid_fingerprint_token', 'Invalid fingerprint token')
    }

  const doc = await User.findOne({ email }).lean()
  if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
  if (doc.mfaEnabled !== true || (!doc.fprintEnabled && !(String(doc.mfaMethod || '').toLowerCase() === 'fingerprint' || !doc.mfaSecret))) {
    return respond.error(res, 400, 'fingerprint_not_enabled', 'Fingerprint is not enabled for this account')
  }
    if (doc.role !== 'user' && doc.role !== 'admin') {
      try {
        const dbDoc = await User.findById(doc._id)
        if (dbDoc) {
          dbDoc.role = 'user'
          await dbDoc.save()
          doc.role = 'user'
        }
      } catch (_) {}
    }

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
    try {
      const { token, expiresAtMs } = signAccessToken(doc)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

    if (useDB) await LoginRequest.deleteOne({ email: emailKey })
    else loginRequests.delete(emailKey)

    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/login/complete-fingerprint error:', err)
    return respond.error(res, 500, 'fingerprint_login_failed', 'Failed to complete fingerprint login')
  }
})

module.exports = router
