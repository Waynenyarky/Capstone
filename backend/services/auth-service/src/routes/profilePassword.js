const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const respond = require('../middleware/respond')
const { requireJwt } = require('../middleware/auth')
const { validateBody, Joi } = require('../middleware/validation')
const { generateCode } = require('../lib/codes')
const { sendOtp } = require('../lib/mailer')
const { changePasswordRequests } = require('../lib/authRequestsStore')
const { decryptWithHash, encryptWithHash } = require('../lib/secretCipher')
const { validatePasswordStrength } = require('../lib/passwordValidator')
const { checkPasswordHistory, addToPasswordHistory } = require('../lib/passwordHistory')
const { sanitizeString } = require('../lib/sanitizer')
const { createAuditLog } = require('../lib/auditLogger')
const { sendPasswordChangeNotification } = require('../lib/notificationService')

const router = express.Router()

const changePasswordAuthenticatedSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(200).required(),
  newPassword: Joi.string().min(6).max(200).required(),
})

const changePasswordStartSchema = Joi.object({
  newPassword: Joi.string().min(12).max(200).required(),
})

const changePasswordVerifySchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

// POST /api/auth/change-password-authenticated
// Change password for a logged-in user by verifying current password.
router.post('/change-password-authenticated', requireJwt, validateBody(changePasswordAuthenticatedSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}

    // Sanitize inputs
    const sanitizedCurrentPassword = sanitizeString(currentPassword || '')
    const sanitizedNewPassword = sanitizeString(newPassword || '')

    // Use userId from JWT token (already validated by requireJwt middleware)
    const userId = req._userId
    if (!userId) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    let doc = null
    try {
      doc = await User.findById(userId).populate('role')
    } catch (_) {
      doc = null
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    // Verify current password
    const ok = await bcrypt.compare(sanitizedCurrentPassword, doc.passwordHash)
    if (!ok) return respond.error(res, 401, 'invalid_current_password', 'Invalid current password')

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(sanitizedNewPassword)
    if (!passwordValidation.valid) {
      return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
    }

    // Check if new password is in history
    const historyCheck = await checkPasswordHistory(sanitizedNewPassword, doc.passwordHistory || [])
    if (historyCheck.inHistory) {
      return respond.error(res, 400, 'password_reused', 'You cannot reuse a recently used password. Please choose a different password.')
    }

    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try { if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret) } catch (_) { mfaPlain = '' }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(sanitizedNewPassword, 10)

    // Add old password to history
    const updatedHistory = addToPasswordHistory(oldHash, doc.passwordHistory || [])

    // Update user
    doc.passwordHash = newPasswordHash
    doc.passwordHistory = updatedHistory
    doc.tokenVersion = (doc.tokenVersion || 0) + 1 // Invalidate all sessions
    doc.mfaReEnrollmentRequired = true // Require MFA re-enrollment
    doc.mfaEnabled = false
    doc.mfaSecret = ''
    doc.fprintEnabled = false
    doc.mfaMethod = ''
    doc.mfaDisablePending = false
    doc.mfaDisableRequestedAt = null
    doc.mfaDisableScheduledFor = null
    doc.tokenFprint = ''

    if (mfaPlain) {
      try { doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain) } catch (_) {}
    }
    await doc.save()

    // Create audit log
    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    await createAuditLog(
      doc._id,
      'password_change',
      'password',
      '[REDACTED]', // Don't log actual passwords
      '[REDACTED]',
      roleSlug,
      {
        ip,
        userAgent,
        tokenVersion: doc.tokenVersion,
        mfaReEnrollmentRequired: true,
      }
    )

    // Send password change notification (non-blocking)
    sendPasswordChangeNotification(doc._id, {
      timestamp: new Date(),
    }).catch((err) => {
      console.error('Failed to send password change notification:', err)
    })

    const userSafe = {
      id: String(doc._id),
      role: doc.role && doc.role.slug ? doc.role.slug : doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      isEmailVerified: !!doc.isEmailVerified,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }

    // Force 200 by adding a cache-busting header or modifying response headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    return res.json(userSafe)
  } catch (err) {
    console.error('POST /api/auth/change-password-authenticated error:', err)
    return respond.error(res, 500, 'change_password_failed', 'Failed to change password')
  }
})

// POST /api/auth/change-password/start
// Step 1: send OTP to email to confirm password change
router.post('/change-password/start', requireJwt, validateBody(changePasswordStartSchema), async (req, res) => {
  try {
    const { newPassword } = req.body || {}
    
    // Use userId from JWT token (already validated by requireJwt middleware)
    const userId = req._userId
    if (!userId) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    let doc = null
    try {
      doc = await User.findById(userId)
    } catch (_) {
      doc = null
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    // Validate new password strength
    const sanitizedNewPassword = sanitizeString(newPassword || '')
    const passwordValidation = validatePasswordStrength(sanitizedNewPassword)
    if (!passwordValidation.valid) {
      return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
    }

    // Check if new password is in history
    const historyCheck = await checkPasswordHistory(sanitizedNewPassword, doc.passwordHistory || [])
    if (historyCheck.inHistory) {
      return respond.error(res, 400, 'password_reused', 'You cannot reuse a recently used password. Please choose a different password.')
    }

    const email = String(doc.email || '').toLowerCase()
    const code = generateCode()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000
    const key = email
    
    // Store the request with the new password (will be hashed after OTP verification)
    changePasswordRequests.set(key, { 
      code, 
      expiresAt: expiresAtMs, 
      newPassword: sanitizedNewPassword,
      verified: false 
    })

    await sendOtp({ to: email, code, subject: 'Confirm password change' })
    return res.json({ 
      sent: true, 
      to: email, 
      expiresAt: new Date(expiresAtMs).toISOString(),
      // Include dev code in non-production for testing
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    console.error('POST /api/auth/change-password/start error:', err)
    return respond.error(res, 500, 'change_password_start_failed', 'Failed to send verification code')
  }
})

// POST /api/auth/change-password/verify
// Step 2: verify OTP and change password
router.post('/change-password/verify', requireJwt, validateBody(changePasswordVerifySchema), async (req, res) => {
  try {
    const { code } = req.body || {}
    
    // Use userId from JWT token (already validated by requireJwt middleware)
    const userId = req._userId
    if (!userId) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    let doc = null
    try {
      doc = await User.findById(userId).populate('role')
    } catch (_) {
      doc = null
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const email = String(doc.email || '').toLowerCase()
    const reqObj = changePasswordRequests.get(email)
    
    if (!reqObj) return respond.error(res, 404, 'request_not_found', 'No password change request found. Please start again.')
    if (Date.now() > reqObj.expiresAt) {
      changePasswordRequests.delete(email)
      return respond.error(res, 410, 'code_expired', 'Verification code expired. Please request a new one.')
    }
    if (String(reqObj.code) !== String(code)) {
      return respond.error(res, 401, 'invalid_code', 'Invalid verification code')
    }
    if (!reqObj.verified) {
      reqObj.verified = true
      changePasswordRequests.set(email, reqObj)
    }

    const sanitizedNewPassword = reqObj.newPassword

    // Validate new password strength again (safety check)
    const passwordValidation = validatePasswordStrength(sanitizedNewPassword)
    if (!passwordValidation.valid) {
      changePasswordRequests.delete(email)
      return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
    }

    // Check if new password is in history again (safety check)
    const historyCheck = await checkPasswordHistory(sanitizedNewPassword, doc.passwordHistory || [])
    if (historyCheck.inHistory) {
      changePasswordRequests.delete(email)
      return respond.error(res, 400, 'password_reused', 'You cannot reuse a recently used password. Please choose a different password.')
    }

    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try { if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret) } catch (_) { mfaPlain = '' }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(sanitizedNewPassword, 10)

    // Add old password to history
    const updatedHistory = addToPasswordHistory(oldHash, doc.passwordHistory || [])

    // Update user
    doc.passwordHash = newPasswordHash
    doc.passwordHistory = updatedHistory
    doc.tokenVersion = (doc.tokenVersion || 0) + 1 // Invalidate all sessions
    doc.mfaReEnrollmentRequired = true // Require MFA re-enrollment
    doc.mfaEnabled = false
    doc.mfaSecret = ''
    doc.fprintEnabled = false
    doc.mfaMethod = ''
    doc.mfaDisablePending = false
    doc.mfaDisableRequestedAt = null
    doc.mfaDisableScheduledFor = null
    doc.tokenFprint = ''

    if (mfaPlain) {
      try { doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain) } catch (_) {}
    }
    await doc.save()

    // Clean up the request
    changePasswordRequests.delete(email)

    // Create audit log
    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    await createAuditLog(
      doc._id,
      'password_change',
      'password',
      '[REDACTED]', // Don't log actual passwords
      '[REDACTED]',
      roleSlug,
      {
        ip,
        userAgent,
        tokenVersion: doc.tokenVersion,
        mfaReEnrollmentRequired: true,
        method: 'otp_verification',
      }
    )

    // Send password change notification (non-blocking)
    sendPasswordChangeNotification(doc._id, {
      timestamp: new Date(),
    }).catch((err) => {
      console.error('Failed to send password change notification:', err)
    })

    const userSafe = {
      id: String(doc._id),
      role: doc.role && doc.role.slug ? doc.role.slug : doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      isEmailVerified: !!doc.isEmailVerified,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }

    // Generate new access token since tokenVersion was incremented
    // This ensures the user stays logged in after password change
    try {
      const { signAccessToken } = require('../middleware/auth')
      const { token, expiresAtMs } = signAccessToken(doc)
      userSafe.token = token
      userSafe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (tokenErr) {
      console.error('Failed to generate new token after password change:', tokenErr)
      // Continue without token - user will need to log in again
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    return res.json(userSafe)
  } catch (err) {
    console.error('POST /api/auth/change-password/verify error:', err)
    return respond.error(res, 500, 'change_password_verify_failed', 'Failed to verify code and change password')
  }
})

module.exports = router
