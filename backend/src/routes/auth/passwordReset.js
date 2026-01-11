const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const { generateCode, generateToken } = require('../../lib/codes')
const { resetRequests } = require('../../lib/authRequestsStore')
const ResetRequest = require('../../models/ResetRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')
const { decryptWithHash, encryptWithHash } = require('../../lib/secretCipher')
const { sendOtp } = require('../../lib/mailer')

const router = express.Router()

const emailOnlySchema = Joi.object({
  email: Joi.string().email().required(),
})

const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

const changePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  resetToken: Joi.string().required(),
  password: Joi.string().min(6).max(200).required(),
})

const changeEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  resetToken: Joi.string().required(),
  newEmail: Joi.string().email().required(),
})

const sendCodeLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  code: 'reset_code_rate_limited',
  message: 'Too many reset code requests; try again later.',
})

const verifyLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  code: 'reset_verify_rate_limited',
  message: 'Too many verification attempts; try again later.',
})

// POST /api/auth/forgot-password
router.post('/forgot-password', sendCodeLimiter, validateBody(emailOnlySchema), async (req, res) => {
  try {
    let { email } = req.body || {}
    const emailKey = String(email).toLowerCase().trim()

    // Check existence
    const exists = await User.findOne({ email: emailKey }).lean()
    if (!exists) return respond.error(res, 404, 'email_not_found', 'Email not found')

    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await ResetRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs), verified: false, resetToken: null },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      resetRequests.set(emailKey, { code, expiresAt: expiresAtMs, verified: false, resetToken: null })
    }

    await sendOtp({ to: email, code, subject: 'Reset your password' })
    const payload = { sent: true }
    if (process.env.NODE_ENV !== 'production') payload.devCode = code
    return res.json(payload)
  } catch (err) {
    console.error('POST /api/auth/forgot-password error:', err)
    return respond.error(res, 500, 'reset_start_failed', 'Failed to send reset code')
  }
})

// POST /api/auth/verify-code
router.post('/verify-code', verifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    if (useDB) {
      reqObj = await ResetRequest.findOne({ email: emailKey })
      if (!reqObj) return respond.error(res, 404, 'reset_request_not_found', 'No reset request found')
      if (Date.now() > new Date(reqObj.expiresAt).getTime()) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
      const token = generateToken()
      reqObj.verified = true
      reqObj.resetToken = token
      await reqObj.save()
      return res.json({ verified: true, resetToken: token })
    } else {
      reqObj = resetRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'reset_request_not_found', 'No reset request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
      const token = generateToken()
      reqObj.verified = true
      reqObj.resetToken = token
      resetRequests.set(emailKey, reqObj)
      return res.json({ verified: true, resetToken: token })
    }

    const token = generateToken()
    reqObj.verified = true
    reqObj.resetToken = token
    resetRequests.set(emailKey, reqObj)
    return res.json({ verified: true, resetToken: token })
  } catch (err) {
    console.error('POST /api/auth/verify-code error:', err)
    return respond.error(res, 500, 'reset_verify_failed', 'Failed to verify code')
  }
})

// POST /api/auth/change-password
router.post('/change-password', validateBody(changePasswordSchema), async (req, res) => {
  try {
    const { email, resetToken, password } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let valid = false
    if (useDB) {
      const reqDoc = await ResetRequest.findOne({ email: emailKey }).lean()
      valid = !!reqDoc && !!reqDoc.verified && String(reqDoc.resetToken) === String(resetToken)
    } else {
      const reqObj = resetRequests.get(emailKey)
      valid = !!reqObj && !!reqObj.verified && String(reqObj.resetToken) === String(resetToken)
    }
    if (!valid) {
      return respond.error(res, 401, 'invalid_reset_token', 'Invalid or missing reset token')
    }

    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')
    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try { if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret) } catch (_) { mfaPlain = '' }

    const passwordHash = await bcrypt.hash(password, 10)
    doc.passwordHash = passwordHash
    if (mfaPlain) {
      try { doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain) } catch (_) {}
    }
    await doc.save()

    // Cleanup reset state
    if (useDB) await ResetRequest.deleteOne({ email: emailKey })
    else resetRequests.delete(emailKey)

    return res.json({ updated: true })
  } catch (err) {
    console.error('POST /api/auth/change-password error:', err)
    return respond.error(res, 500, 'change_password_failed', 'Failed to change password')
  }
})

// POST /api/auth/change-email
router.post('/change-email', validateBody(changeEmailSchema), async (req, res) => {
  try {
    const { email, resetToken, newEmail } = req.body || {}

    const currentEmailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let valid = false
    if (useDB) {
      const reqDoc = await ResetRequest.findOne({ email: currentEmailKey }).lean()
      valid = !!reqDoc && !!reqDoc.verified && String(reqDoc.resetToken) === String(resetToken)
    } else {
      const reqObj = resetRequests.get(currentEmailKey)
      valid = !!reqObj && !!reqObj.verified && String(reqObj.resetToken) === String(resetToken)
    }
    if (!valid) {
      return respond.error(res, 401, 'invalid_reset_token', 'Invalid or missing reset token')
    }

    const normalizedNewEmail = String(newEmail).trim()
    if (!normalizedNewEmail) {
      return respond.error(res, 400, 'invalid_new_email', 'newEmail cannot be empty')
    }

    // Ensure the new email is not already taken
    const existing = await User.findOne({ email: normalizedNewEmail }).lean()
    if (existing) {
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }

    // Load the current user by the provided email
    const doc = await User.findOne({ email }).populate('role')
    if (!doc) {
      return respond.error(res, 404, 'user_not_found', 'User not found')
    }

    // Update email
    doc.email = normalizedNewEmail
    await doc.save()

    // Cleanup reset state for the old email
    if (useDB) await ResetRequest.deleteOne({ email: currentEmailKey })
    else resetRequests.delete(currentEmailKey)

    const safe = {
      id: String(doc._id),
      role: doc.role && doc.role.slug ? doc.role.slug : doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }

    return res.json(safe)
  } catch (err) {
    console.error('POST /api/auth/change-email error:', err)
    return respond.error(res, 500, 'change_email_failed', 'Failed to change email')
  }
})

module.exports = router
