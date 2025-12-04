const rateLimit = require('express-rate-limit')
const respond = require('./respond')

function perEmailRateLimit({ windowMs, max, code, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res /*, next, options */) => {
      return respond.error(res, 429, code || 'rate_limit_exceeded', message || 'Too many requests')
    },
  })
}

module.exports = { perEmailRateLimit }