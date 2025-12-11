const express = require('express')
const mongoose = require('mongoose')
const User = require('../../models/User')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { otpauthUri, generateSecret, verifyTotpWithCounter } = require('../../lib/totp')
const { sendOtp } = require('../../lib/mailer')
const { mfaRequests } = require('../../lib/authRequestsStore')
const { encryptWithHash, decryptWithHash } = require('../../lib/secretCipher')

const router = express.Router()

const setupSchema = Joi.object({
  method: Joi.string().valid('authenticator').required(),
})

const verifySchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

const oneDayMs = 24 * 60 * 60 * 1000

function requireUser(req, res, next) {
  const emailHeader = String(req.headers['x-user-email'] || '').toLowerCase()
  if (!emailHeader) return respond.error(res, 401, 'unauthorized', 'Unauthorized: missing user email')
  req._userEmail = emailHeader
  next()
}

// POST /api/auth/mfa/setup
router.post('/mfa/setup', requireUser, validateBody(setupSchema), async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    const secret = generateSecret(20)
    const issuer = String(process.env.DEFAULT_FROM_EMAIL || 'Capstone').replace(/<.*?>/g, '').trim() || 'Capstone'
    const uri = otpauthUri({ issuer, account: email, secret, algorithm: 'SHA1', digits: 6, period: 30 })

    doc.mfaSecret = encryptWithHash(doc.passwordHash, secret)
    doc.mfaEnabled = false
    await doc.save()

    return res.json({ secret, otpauthUri: uri, issuer })
  } catch (err) {
    console.error('POST /api/auth/mfa/setup error:', err)
    return respond.error(res, 500, 'mfa_setup_failed', 'Failed to setup MFA')
  }
})

// POST /api/auth/mfa/disable-request
router.post('/mfa/disable-request', requireUser, async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (doc.mfaEnabled !== true || !doc.mfaSecret) {
      return respond.error(res, 400, 'mfa_not_enabled', 'MFA not enabled')
    }
    if (doc.mfaDisablePending) {
      return res.json({ disablePending: true, scheduledFor: doc.mfaDisableScheduledFor })
    }
    const now = Date.now()
    doc.mfaDisablePending = true
    doc.mfaDisableRequestedAt = new Date(now)
    doc.mfaDisableScheduledFor = new Date(now + oneDayMs)
    await doc.save()
    return res.json({ disablePending: true, scheduledFor: doc.mfaDisableScheduledFor })
  } catch (err) {
    console.error('POST /api/auth/mfa/disable-request error:', err)
    return respond.error(res, 500, 'mfa_disable_request_failed', 'Failed to request MFA disable')
  }
})

// POST /api/auth/mfa/disable-undo
router.post('/mfa/disable-undo', requireUser, validateBody(verifySchema), async (req, res) => {
  try {
    const email = req._userEmail
  const { code } = req.body || {}
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (!doc.mfaDisablePending) return res.json({ canceled: false, message: 'No pending disable' })
    if (!doc.mfaSecret) return respond.error(res, 400, 'mfa_not_setup', 'MFA not set up')
    const secretPlain = decryptWithHash(doc.passwordHash, doc.mfaSecret)
    const resVerify = verifyTotpWithCounter({ secret: secretPlain, token: String(code), window: 1, period: 30, digits: 6 })
    if (!resVerify.ok) return respond.error(res, 401, 'invalid_mfa_code', 'Invalid verification code')
    if (typeof doc.mfaLastUsedTotpCounter === 'number' && doc.mfaLastUsedTotpCounter === resVerify.counter) {
      return respond.error(res, 401, 'totp_replayed', 'Verification code already used')
    }
    if (typeof doc.mfaLastUsedTotpCounter === 'number' && doc.mfaLastUsedTotpCounter === resVerify.counter) {
      return respond.error(res, 401, 'totp_replayed', 'Verification code already used')
    }
    if (typeof doc.mfaLastUsedTotpCounter === 'number' && doc.mfaLastUsedTotpCounter === resVerify.counter) {
      return respond.error(res, 401, 'totp_replayed', 'Verification code already used')
    }

    doc.mfaDisablePending = false
    doc.mfaDisableRequestedAt = null
    doc.mfaDisableScheduledFor = null
    doc.mfaLastUsedTotpCounter = resVerify.counter
    doc.mfaLastUsedTotpAt = new Date()
    await doc.save()
    return res.json({ canceled: true })
  } catch (err) {
    console.error('POST /api/auth/mfa/disable-undo error:', err)
    return respond.error(res, 500, 'mfa_disable_undo_failed', 'Failed to undo MFA disable')
  }
})

// POST /api/auth/mfa/verify
router.post('/mfa/verify', requireUser, validateBody(verifySchema), async (req, res) => {
  try {
    const email = req._userEmail
    const { code } = req.body || {}
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (!doc.mfaSecret) return respond.error(res, 400, 'mfa_not_setup', 'MFA not set up')

    const secretPlain = decryptWithHash(doc.passwordHash, doc.mfaSecret)
    const resVerify = verifyTotpWithCounter({ secret: secretPlain, token: String(code), window: 1, period: 30, digits: 6 })
    if (!resVerify.ok) return respond.error(res, 401, 'invalid_mfa_code', 'Invalid verification code')

    doc.mfaEnabled = true
    doc.mfaMethod = doc.fprintEnabled ? 'authenticator,fingerprint' : 'authenticator'
    doc.mfaLastUsedTotpCounter = resVerify.counter
    doc.mfaLastUsedTotpAt = new Date()
    await doc.save()
    return res.json({ enabled: true })
  } catch (err) {
    console.error('POST /api/auth/mfa/verify error:', err)
    return respond.error(res, 500, 'mfa_verify_failed', 'Failed to verify MFA')
  }
})

// POST /api/auth/mfa/disable
router.post('/mfa/disable', requireUser, async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    doc.mfaEnabled = false
    doc.mfaSecret = ''
    doc.fprintEnabled = false
    await doc.save()
    return res.json({ disabled: true })
  } catch (err) {
    console.error('POST /api/auth/mfa/disable error:', err)
    return respond.error(res, 500, 'mfa_disable_failed', 'Failed to disable MFA')
  }
})

// GET /api/auth/mfa/status
router.get('/mfa/status', requireUser, async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (doc.mfaDisablePending && doc.mfaDisableScheduledFor && Date.now() >= new Date(doc.mfaDisableScheduledFor).getTime()) {
      doc.mfaEnabled = false
      doc.mfaSecret = ''
      doc.mfaDisablePending = false
      doc.mfaDisableRequestedAt = null
      doc.mfaDisableScheduledFor = null
      doc.fprintEnabled = false
      await doc.save()
    }
    const method = String(doc.mfaMethod || '').toLowerCase()
    const isFingerprint = !!doc.fprintEnabled || (!!doc.mfaEnabled && (method === 'fingerprint' || !doc.mfaSecret))
    return res.json({ enabled: !!doc.mfaEnabled, disablePending: !!doc.mfaDisablePending, scheduledFor: doc.mfaDisableScheduledFor, method, isFingerprintEnabled: isFingerprint, fprintEnabled: !!doc.fprintEnabled })
  } catch (err) {
    console.error('GET /api/auth/mfa/status error:', err)
    return respond.error(res, 500, 'mfa_status_failed', 'Failed to get MFA status')
  }
})

// POST /api/auth/mfa/fingerprint/start
router.post('/mfa/fingerprint/start', requireUser, async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAt = Date.now() + ttlMin * 60 * 1000
    const code = String(Math.floor(100000 + Math.random() * 900000))

    const key = String(email).toLowerCase()
    mfaRequests.set(key, { code, expiresAt, verified: false, method: 'fingerprint' })

    await sendOtp({ to: email, code, subject: 'Enable fingerprint verification' })
    return res.json({ sent: true })
  } catch (err) {
    console.error('POST /api/auth/mfa/fingerprint/start error:', err)
    return respond.error(res, 500, 'fingerprint_start_failed', 'Failed to send verification code')
  }
})

// POST /api/auth/mfa/fingerprint/verify
router.post('/mfa/fingerprint/verify', requireUser, validateBody(verifySchema), async (req, res) => {
  try {
    const email = req._userEmail
    const { code } = req.body || {}
    const key = String(email).toLowerCase()
    const reqObj = mfaRequests.get(key)
    if (!reqObj) return respond.error(res, 404, 'fingerprint_request_not_found', 'No fingerprint verification request found')
    if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
    if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')

    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    doc.mfaEnabled = true
    doc.fprintEnabled = true
    const hasTotp = !!doc.mfaSecret
    doc.mfaMethod = hasTotp ? 'authenticator,fingerprint' : 'fingerprint'
    await doc.save()
    mfaRequests.delete(key)
    return res.json({ enabled: true })
  } catch (err) {
    console.error('POST /api/auth/mfa/fingerprint/verify error:', err)
    return respond.error(res, 500, 'fingerprint_verify_failed', 'Failed to verify fingerprint')
  }
})

// POST /api/auth/mfa/fingerprint/disable
router.post('/mfa/fingerprint/disable', requireUser, async (req, res) => {
  try {
    const email = req._userEmail
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    const hasTotp = !!doc.mfaSecret
    doc.fprintEnabled = false
    if (hasTotp) {
      doc.mfaEnabled = true
      doc.mfaMethod = 'authenticator'
    } else {
      doc.mfaEnabled = false
      if (String(doc.mfaMethod || '').toLowerCase() === 'fingerprint') doc.mfaMethod = ''
    }
    await doc.save()
    return res.json({ fingerprintDisabled: true, mfaEnabled: !!doc.mfaEnabled })
  } catch (err) {
    console.error('POST /api/auth/mfa/fingerprint/disable error:', err)
    return respond.error(res, 500, 'fingerprint_disable_failed', 'Failed to disable fingerprint')
  }
})

module.exports = router
