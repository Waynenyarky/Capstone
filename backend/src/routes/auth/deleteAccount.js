const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const { generateCode, generateToken } = require('../../lib/codes')
const { deleteRequests } = require('../../lib/authRequestsStore')
const DeleteRequest = require('../../models/DeleteRequest')
const { sendOtp } = require('../../lib/mailer')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')
const { createAuditLog } = require('../../lib/auditLogger')
const { trackIP, isUnusualIP } = require('../../lib/ipTracker')
const { checkLockout, incrementFailedAttempts } = require('../../lib/accountLockout')
const securityMonitor = require('../../middleware/securityMonitor')
const { isBusinessOwnerRole } = require('../../lib/roleHelpers')

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
  legalAcknowledgment: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must acknowledge that this action is irreversible',
  }),
})

const passwordOnlySchema = Joi.object({
  password: Joi.string().min(1).max(200).required(),
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

router.post('/delete-account/authenticated', validateBody(passwordOnlySchema), async (req, res) => {
  try {
    const { password } = req.body || {}
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const ok = await bcrypt.compare(String(password || ''), String(doc.passwordHash || ''))
    if (!ok) return respond.error(res, 401, 'invalid_current_password', 'Invalid current password')

    try {
      await User.deleteOne({ _id: doc._id })
    } catch (userErr) {
      console.error('User hard delete error:', userErr)
      return respond.error(res, 500, 'delete_failed', 'Failed to delete account')
    }

    return res.json({ deleted: true })
  } catch (err) {
    console.error('POST /api/auth/delete-account/authenticated error:', err)
    return respond.error(res, 500, 'delete_failed', 'Failed to delete account')
  }
})

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

    await sendOtp({ to: doc.email, code, subject: 'Confirm account deletion' })
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
    const { email, deleteToken, legalAcknowledgment } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Verify legal acknowledgment
    if (!legalAcknowledgment) {
      return respond.error(res, 400, 'legal_acknowledgment_required', 'You must acknowledge that this action is irreversible')
    }

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

    const doc = await User.findOne({ email }).populate('role')
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    // Check account lockout
    const lockoutCheck = await checkLockout(doc._id)
    if (lockoutCheck.locked) {
      return respond.error(res, 423, 'account_locked', `Account is temporarily locked. Try again in ${lockoutCheck.remainingMinutes} minutes.`)
    }

    // Check for suspicious activity: unusual IP
    const ipCheck = await isUnusualIP(doc._id, ipAddress)
    const suspiciousActivity = ipCheck.isUnusual

    // Track IP
    await trackIP(doc._id, ipAddress)

    // Detect suspicious patterns
    if (suspiciousActivity) {
      securityMonitor.detectSuspiciousActivity(req)
      await incrementFailedAttempts(doc._id)
    }

    // Generate undo token (valid for 7 days)
    const undoToken = generateToken()
    const undoExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const requestedAt = new Date()
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    doc.deletionRequestedAt = requestedAt
    doc.deletionScheduledFor = scheduledFor
    doc.deletionPending = true
    doc.deletionUndoToken = undoToken
    doc.deletionUndoExpiresAt = undoExpiresAt
    await doc.save()

    // Log to audit trail
    const roleSlug = doc.role?.slug || 'user'
    await createAuditLog(
      doc._id,
      'account_deletion_scheduled',
      'account',
      '',
      'deletion_scheduled',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        scheduledFor: scheduledFor.toISOString(),
        undoExpiresAt: undoExpiresAt.toISOString(),
        suspiciousActivityDetected: suspiciousActivity,
      }
    )

    // Cleanup delete request state
    if (useDB) await DeleteRequest.deleteOne({ email: emailKey })
    else deleteRequests.delete(emailKey)

    const userSafe = {
      id: String(doc._id),
      role: doc.role?.slug || doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
      undoToken, // Include undo token so user can cancel
      undoExpiresAt: undoExpiresAt.toISOString(),
    }

    return res.json({ 
      scheduled: true, 
      user: userSafe,
      message: 'Account deletion scheduled. You can undo this within 7 days.',
      warning: suspiciousActivity ? 'Unusual activity detected. If this wasn\'t you, contact support immediately.' : undefined,
    })
  } catch (err) {
    console.error('POST /api/auth/delete-account/confirm error:', err)
    return respond.error(res, 500, 'delete_confirm_failed', 'Failed to schedule account deletion')
  }
})

// POST /api/auth/delete-account/cancel
// Cancels a previously scheduled account deletion. Requires header-based identification or undo token.
const cancelDeleteSchema = Joi.object({
  undoToken: Joi.string().optional(),
})
router.post('/delete-account/cancel', validateBody(cancelDeleteSchema), async (req, res) => {
  try {
    const { undoToken } = req.body || {}
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    let doc = null
    
    // If undo token provided, use it
    if (undoToken) {
      doc = await User.findOne({ 
        deletionUndoToken: undoToken,
        deletionPending: true,
      }).populate('role')
      
      if (!doc) {
        return respond.error(res, 401, 'invalid_undo_token', 'Invalid or expired undo token')
      }

      // Check if undo token is expired
      if (doc.deletionUndoExpiresAt && Date.now() > doc.deletionUndoExpiresAt.getTime()) {
        return respond.error(res, 401, 'undo_token_expired', 'Undo token has expired. Deletion cannot be cancelled.')
      }
    } else {
      // Use header-based identification
      if (idHeader) {
        try {
          doc = await User.findById(idHeader).populate('role')
        } catch (_) {
          doc = null
        }
      }
      if (!doc && emailHeader) {
        doc = await User.findOne({ email: emailHeader }).populate('role')
      }
    }

    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    if (!doc.deletionPending) {
      return respond.error(res, 400, 'no_deletion_pending', 'No deletion is currently scheduled')
    }

    // Cancel deletion
    doc.deletionRequestedAt = null
    doc.deletionScheduledFor = null
    doc.deletionPending = false
    doc.deletionUndoToken = null
    doc.deletionUndoExpiresAt = null
    await doc.save()

    // Log to audit trail
    const roleSlug = doc.role?.slug || 'user'
    await createAuditLog(
      doc._id,
      'account_deletion_undone',
      'account',
      'deletion_scheduled',
      'deletion_cancelled',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        method: undoToken ? 'undo_token' : 'manual',
      }
    )

    const userSafe = {
      id: String(doc._id),
      role: doc.role?.slug || doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: false,
      deletionRequestedAt: null,
      deletionScheduledFor: null,
    }

    return res.json({ cancelled: true, user: userSafe })
  } catch (err) {
    console.error('POST /api/auth/delete-account/cancel error:', err)
    return respond.error(res, 500, 'delete_cancel_failed', 'Failed to cancel account deletion')
  }
})

module.exports = router
