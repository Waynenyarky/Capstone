const express = require('express')
const mongoose = require('mongoose')
const User = require('../../models/User')
const { generateCode, generateToken } = require('../../lib/codes')
const { deleteRequests } = require('../../lib/authRequestsStore')
const DeleteRequest = require('../../models/DeleteRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')

const router = express.Router()

const optionalEmailSchema = Joi.object({
  email: Joi.string().email().optional(),
})

const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

const confirmDeleteSchema = Joi.object({
  email: Joi.string().email().required(),
  deleteToken: Joi.string().required(),
})

const sendCodeLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  code: 'delete_code_rate_limited',
  message: 'Too many delete code requests; try again later.',
})

const verifyLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  code: 'delete_verify_rate_limited',
  message: 'Too many verification attempts; try again later.',
})

// --- Delete Account (30-day waiting period) ---

// POST /api/auth/delete-account/send-code
// Sends a verification code to the current user's email to initiate deletion
router.post('/delete-account/send-code', sendCodeLimiter, validateBody(optionalEmailSchema), async (req, res) => {
  try {
    const { email: bodyEmail } = req.body || {}
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader).lean() } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader }).lean()
    }
    if (!doc && bodyEmail) {
      doc = await User.findOne({ email: bodyEmail }).lean()
    }
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    const emailKey = String(doc.email).toLowerCase()
    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await DeleteRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs), verified: false, deleteToken: null },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      deleteRequests.set(emailKey, { code, expiresAt: expiresAtMs, verified: false, deleteToken: null })
    }

    const payload = { sent: true }
    if (process.env.NODE_ENV !== 'production') payload.devCode = code
    return res.json(payload)
  } catch (err) {
    console.error('POST /api/auth/delete-account/send-code error:', err)
    return respond.error(res, 500, 'delete_code_failed', 'Failed to send delete verification code')
  }
})

// POST /api/auth/delete-account/verify-code
// Verifies the code and returns a deleteToken usable to confirm deletion
router.post('/delete-account/verify-code', verifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      const reqDoc = await DeleteRequest.findOne({ email: emailKey })
      if (!reqDoc) return respond.error(res, 404, 'delete_request_not_found', 'No delete request found')
      if (Date.now() > new Date(reqDoc.expiresAt).getTime()) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqDoc.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
      const token = generateToken()
      reqDoc.verified = true
      reqDoc.deleteToken = token
      await reqDoc.save()
      return res.json({ verified: true, deleteToken: token })
    } else {
      const reqObj = deleteRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'delete_request_not_found', 'No delete request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
      const token = generateToken()
      reqObj.verified = true
      reqObj.deleteToken = token
      deleteRequests.set(emailKey, reqObj)
      return res.json({ verified: true, deleteToken: token })
    }
  } catch (err) {
    console.error('POST /api/auth/delete-account/verify-code error:', err)
    return respond.error(res, 500, 'delete_verify_failed', 'Failed to verify delete code')
  }
})

// POST /api/auth/delete-account/confirm
// Schedules account deletion in 30 days after verifying deleteToken
router.post('/delete-account/confirm', validateBody(confirmDeleteSchema), async (req, res) => {
  try {
    const { email, deleteToken } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let valid = false
    if (useDB) {
      const reqDoc = await DeleteRequest.findOne({ email: emailKey }).lean()
      valid = !!reqDoc && !!reqDoc.verified && String(reqDoc.deleteToken) === String(deleteToken)
    } else {
      const reqObj = deleteRequests.get(emailKey)
      valid = !!reqObj && !!reqObj.verified && String(reqObj.deleteToken) === String(deleteToken)
    }
    if (!valid) {
      return respond.error(res, 401, 'invalid_delete_token', 'Invalid or missing delete token')
    }

    const doc = await User.findOne({ email })
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    const requestedAt = new Date()
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    doc.deletionRequestedAt = requestedAt
    doc.deletionScheduledFor = scheduledFor
    doc.deletionPending = true
    await doc.save()

    // Provider mirror removed

    // Cleanup delete request state
    if (useDB) await DeleteRequest.deleteOne({ email: emailKey })
    else deleteRequests.delete(emailKey)

    const userSafe = {
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
    }

    return res.json({ scheduled: true, user: userSafe })
  } catch (err) {
    console.error('POST /api/auth/delete-account/confirm error:', err)
    return respond.error(res, 500, 'delete_confirm_failed', 'Failed to schedule account deletion')
  }
})

// POST /api/auth/delete-account/cancel
// Cancels a previously scheduled account deletion. Requires header-based identification.
router.post('/delete-account/cancel', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try {
        doc = await User.findById(idHeader)
      } catch (_) {
        doc = null
      }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    doc.deletionRequestedAt = null
    doc.deletionScheduledFor = null
    doc.deletionPending = false
    await doc.save()

    // Provider mirror removed

    const userSafe = {
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
    }

    return res.json({ cancelled: true, user: userSafe })
  } catch (err) {
    console.error('POST /api/auth/delete-account/cancel error:', err)
    return respond.error(res, 500, 'delete_cancel_failed', 'Failed to cancel account deletion')
  }
})

module.exports = router
