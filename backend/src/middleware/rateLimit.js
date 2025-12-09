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
      const bodyEmail = req.body && req.body.email ? String(req.body.email).toLowerCase() : ''
      const headerEmail = String(req.headers['x-user-email'] || '').toLowerCase()
      if (bodyEmail) return bodyEmail
      if (headerEmail) return headerEmail
      return ipKeyGenerator(req)
    },
    handler: (req, res /*, next, options */) => {
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

module.exports = { perEmailRateLimit }
