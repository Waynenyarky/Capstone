const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')
const respond = require('./respond')

function perEmailRateLimit({ windowMs, max, code, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req /*, res*/) => {
      const bodyEmail = req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : ''
      const headerEmail = String(req.headers['x-user-email'] || '').toLowerCase().trim()
      if (bodyEmail) return bodyEmail
      if (headerEmail) return headerEmail
      return ipKeyGenerator(req)
    },
    handler: (req, res /*, next, options */) => {
      // Flag rate limit violation for security monitoring
      req.rateLimitViolated = true
      
      let retryAfterSec = 0
      try {
        const rl = req.rateLimit || {}
        let resetMs = 0
        if (rl.resetTime) {
          resetMs = new Date(rl.resetTime).getTime()
        } else if (typeof rl.resetMs === 'number') {
          resetMs = rl.resetMs
        }
        if (resetMs > Date.now()) {
          retryAfterSec = Math.ceil((resetMs - Date.now()) / 1000)
        }
      } catch (_) {}
      const baseMsg = message || 'Too many requests'
      const msg = retryAfterSec > 0 ? `${baseMsg} Try again in ${retryAfterSec}s.` : baseMsg
      return respond.error(res, 429, code || 'rate_limit_exceeded', msg)
    },
  })
}

/**
 * Rate limiter for verification requests (OTP/MFA)
 * 5 attempts per 15 minutes per user
 */
function verificationRateLimit() {
  return perEmailRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    code: 'verification_rate_limited',
    message: 'Too many verification requests. Please try again later.',
  })
}

/**
 * Rate limiter for profile updates
 * 10 updates per minute per user
 */
function profileUpdateRateLimit() {
  return perEmailRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    code: 'profile_update_rate_limited',
    message: 'Too many profile updates. Please slow down.',
  })
}

/**
 * Rate limiter for password changes
 * 3 attempts per hour per user
 */
function passwordChangeRateLimit() {
  return perEmailRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    code: 'password_change_rate_limited',
    message: 'Too many password change attempts. Please try again later.',
  })
}

/**
 * Rate limiter for ID uploads
 * 5 uploads per hour per user
 */
function idUploadRateLimit() {
  return perEmailRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    code: 'id_upload_rate_limited',
    message: 'Too many ID upload attempts. Please try again later.',
  })
}

/**
 * Rate limiter for admin approval requests
 * 10 requests per hour per admin
 */
function adminApprovalRateLimit() {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyGenerator: (req) => {
      // Use admin user ID for rate limiting
      return req._userId || ipKeyGenerator(req)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Flag rate limit violation for security monitoring
      req.rateLimitViolated = true
      
      let retryAfterSec = 0
      try {
        const rl = req.rateLimit || {}
        let resetMs = 0
        if (rl.resetTime) {
          resetMs = new Date(rl.resetTime).getTime()
        } else if (typeof rl.resetMs === 'number') {
          resetMs = rl.resetMs
        }
        if (resetMs > Date.now()) {
          retryAfterSec = Math.ceil((resetMs - Date.now()) / 1000)
        }
      } catch (_) {}
      const baseMsg = 'Too many approval requests'
      const msg = retryAfterSec > 0 ? `${baseMsg}. Try again in ${retryAfterSec}s.` : baseMsg
      return respond.error(res, 429, 'admin_approval_rate_limited', msg)
    },
  })
}

module.exports = {
  perEmailRateLimit,
  verificationRateLimit,
  profileUpdateRateLimit,
  passwordChangeRateLimit,
  idUploadRateLimit,
  adminApprovalRateLimit,
}
