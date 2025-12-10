const express = require('express')
const mongoose = require('mongoose')
const User = require('../../models/User')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { otpauthUri, generateSecret, verifyTotp } = require('../../lib/totp')
const { encryptWithHash, decryptWithHash } = require('../../lib/secretCipher')

const router = express.Router()

const setupSchema = Joi.object({
  method: Joi.string().valid('authenticator').required(),
})

const verifySchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

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

// POST /api/auth/mfa/verify
router.post('/mfa/verify', requireUser, validateBody(verifySchema), async (req, res) => {
  try {
    const email = req._userEmail
    const { code } = req.body || {}
    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (!doc.mfaSecret) return respond.error(res, 400, 'mfa_not_setup', 'MFA not set up')

    const secretPlain = decryptWithHash(doc.passwordHash, doc.mfaSecret)
    const ok = verifyTotp({ secret: secretPlain, token: String(code), window: 1, period: 30, digits: 6 })
    if (!ok) return respond.error(res, 401, 'invalid_mfa_code', 'Invalid verification code')

    doc.mfaEnabled = true
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
    const doc = await User.findOne({ email }).lean()
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    return res.json({ enabled: !!doc.mfaEnabled })
  } catch (err) {
    console.error('GET /api/auth/mfa/status error:', err)
    return respond.error(res, 500, 'mfa_status_failed', 'Failed to get MFA status')
  }
})

module.exports = router
