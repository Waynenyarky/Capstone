/**
 * Cloudflare Turnstile server-side verification (IAS-2: Rate + CAPTCHA).
 * When ENABLE_CAPTCHA or TURNSTILE_SECRET_KEY is set, login/signup require a valid token.
 */

const https = require('https')

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verify a Turnstile response token with Cloudflare.
 * @param {string} token - The response token from the Turnstile widget
 * @param {string} [remoteip] - Optional client IP for analytics
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
function verifyTurnstileToken(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !token || typeof token !== 'string') {
    return Promise.resolve({ success: false, error: 'missing_token_or_secret' })
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    ...(remoteip ? { remoteip } : {}),
  }).toString()

  return new Promise((resolve) => {
    const url = new URL(SITEVERIFY_URL)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.success === true) {
            resolve({ success: true })
          } else {
            resolve({ success: false, error: json['error-codes']?.[0] || 'verify_failed' })
          }
        } catch (_) {
          resolve({ success: false, error: 'invalid_response' })
        }
      })
    })
    req.on('error', () => resolve({ success: false, error: 'network_error' }))
    req.setTimeout(10000, () => {
      req.destroy()
      resolve({ success: false, error: 'timeout' })
    })
    req.write(body)
    req.end()
  })
}

/** True when CAPTCHA is enabled (secret key set). */
function isCaptchaEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SECRET_KEY.trim() !== '')
}

function shouldRequireCaptcha(req) {
  if (!isCaptchaEnabled()) return false
  const headers = (req && req.headers) || {}
  const clientType = String(headers['x-client-type'] || '').trim().toLowerCase()
  if (clientType === 'mobile') return false
  const origin = String(headers.origin || '').trim()
  const secFetchSite = String(headers['sec-fetch-site'] || '').trim()
  const secFetchMode = String(headers['sec-fetch-mode'] || '').trim()
  return Boolean(origin || secFetchSite || secFetchMode)
}

module.exports = { verifyTurnstileToken, isCaptchaEnabled, shouldRequireCaptcha }
