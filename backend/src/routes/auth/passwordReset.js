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
const { trackIP, isUnusualIP } = require('../../lib/ipTracker')
const { checkLockout, incrementFailedAttempts } = require('../../lib/accountLockout')
const securityMonitor = require('../../middleware/securityMonitor')
const { checkPasswordHistory, addToPasswordHistory } = require('../../lib/passwordHistory')
const { validatePasswordStrength } = require('../../lib/passwordValidator')
const { createAuditLog } = require('../../lib/auditLogger')

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
  password: Joi.string().min(12).max(200).required(), // Updated to 12 minimum
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
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Check existence
    const user = await User.findOne({ email: emailKey }).populate('role').lean()
    if (!user) return respond.error(res, 404, 'email_not_found', 'Email not found')

    // Check account lockout
    const lockoutCheck = await checkLockout(user._id)
    if (lockoutCheck.locked) {
      return respond.error(res, 423, 'account_locked', `Account is temporarily locked. Try again in ${lockoutCheck.remainingMinutes} minutes.`)
    }

    // Check for suspicious activity: unusual IP
    const ipCheck = await isUnusualIP(user._id, ipAddress)
    const suspiciousActivity = ipCheck.isUnusual

    // Track IP for future comparisons
    await trackIP(user._id, ipAddress)

    // Detect suspicious patterns
    if (suspiciousActivity) {
      // Log suspicious activity
      securityMonitor.detectSuspiciousActivity(req)
      
      // Increment failed attempts (treats unusual IP as suspicious)
      await incrementFailedAttempts(user._id)
      
      // Log to audit trail
      const roleSlug = user.role?.slug || 'user'
      await createAuditLog(
        user._id,
        'security_event',
        'recovery',
        '',
        'unusual_ip_detected',
        roleSlug,
        {
          ip: ipAddress,
          userAgent,
          reason: ipCheck.reason,
        }
      )
    }

    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await ResetRequest.findOneAndUpdate(
        { email: emailKey },
        { 
          code, 
          expiresAt: new Date(expiresAtMs), 
          verified: false, 
          resetToken: null,
          metadata: {
            ipAddress,
            userAgent,
            suspiciousActivityDetected: suspiciousActivity,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      resetRequests.set(emailKey, { 
        code, 
        expiresAt: expiresAtMs, 
        verified: false, 
        resetToken: null,
        metadata: {
          ipAddress,
          userAgent,
          suspiciousActivityDetected: suspiciousActivity,
        },
      })
    }

    await sendOtp({ to: email, code, subject: 'Reset your password' })
    
    // Log recovery initiation to blockchain
    const roleSlug = user.role?.slug || 'user'
    await createAuditLog(
      user._id,
      'account_recovery_initiated',
      'password',
      '',
      'recovery_requested',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        suspiciousActivityDetected: suspiciousActivity,
      }
    )

    const payload = { sent: true }
    if (suspiciousActivity) {
      payload.warning = 'Unusual login location detected. If this wasn\'t you, please contact support immediately.'
    }
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
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

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

    const doc = await User.findOne({ email }).populate('role')
    if (!doc) return respond.error(res, 404, 'user_not_found', 'User not found')

    // Check account lockout
    const lockoutCheck = await checkLockout(doc._id)
    if (lockoutCheck.locked) {
      return respond.error(res, 423, 'account_locked', `Account is temporarily locked. Try again in ${lockoutCheck.remainingMinutes} minutes.`)
    }

    // Validate password strength (12+ chars, upper, lower, number, special)
    const strengthCheck = validatePasswordStrength(password)
    if (!strengthCheck.valid) {
      return respond.error(res, 400, 'weak_password', strengthCheck.errors.join('; '))
    }

    // Check password history (prevent reuse of last 5)
    const historyCheck = await checkPasswordHistory(password, doc.passwordHistory || [])
    if (historyCheck.inHistory) {
      return respond.error(res, 400, 'password_in_history', 'Cannot reuse any of your last 5 passwords')
    }

    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try { if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret) } catch (_) { mfaPlain = '' }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Add old password to history
    const updatedHistory = addToPasswordHistory(oldHash, doc.passwordHistory || [])

    // Update user: password, history, invalidate sessions, require MFA re-enrollment
    doc.passwordHash = passwordHash
    doc.passwordHistory = updatedHistory
    doc.tokenVersion = (doc.tokenVersion || 0) + 1 // Invalidate all sessions
    doc.mfaReEnrollmentRequired = true // Require MFA re-enrollment
    doc.mfaEnabled = false // Disable MFA until re-enrolled
    doc.mfaSecret = '' // Clear MFA secret
    
    // Preserve MFA secret if it exists (re-encrypt with new password hash)
    if (mfaPlain) {
      try { doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain) } catch (_) {}
    }
    
    await doc.save()

    // Track IP
    await trackIP(doc._id, ipAddress)

    // Create audit log
    const roleSlug = doc.role?.slug || 'user'
    await createAuditLog(
      doc._id,
      'account_recovery_completed',
      'password',
      '[REDACTED]', // Don't log actual passwords
      '[REDACTED]',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        tokenVersion: doc.tokenVersion,
        mfaReEnrollmentRequired: true,
        recoveryMethod: 'password_reset',
      }
    )

    // Cleanup reset state
    if (useDB) await ResetRequest.deleteOne({ email: emailKey })
    else resetRequests.delete(emailKey)

    return res.json({ 
      updated: true,
      mfaReEnrollmentRequired: true,
      message: 'Password changed successfully. Please re-enroll MFA on next login.',
    })
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
