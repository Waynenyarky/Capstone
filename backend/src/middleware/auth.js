const jwt = require('jsonwebtoken')

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  const ttlMin = Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 60)
  const nowSec = Math.floor(Date.now() / 1000)
  const expSec = nowSec + Math.max(1, ttlMin) * 60
  const payload = {
    sub: String(user._id || user.id || ''),
    email: String(user.email || ''),
    role: String(user.role && user.role.slug ? user.role.slug : (user.role || '')),
    iat: nowSec,
    exp: expSec,
  }
  const token = jwt.sign(payload, secret)
  return { token, expiresAtMs: expSec * 1000 }
}

function requireJwt(req, res, next) {
  try {
    const auth = String(req.headers['authorization'] || '')
    const m = auth.match(/^Bearer\s+(.+)$/i)
    const token = m ? m[1] : ''
    if (!token) return res.status(401).json({ error: { code: 'unauthorized', message: 'Unauthorized: missing token' } })
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
    const decoded = jwt.verify(token, secret)
    req._userId = String(decoded.sub || '')
    req._userEmail = String(decoded.email || '')
    req._userRole = String(decoded.role || '')
    next()
  } catch (err) {
    return res.status(401).json({ error: { code: 'invalid_token', message: 'Unauthorized: invalid or expired token' } })
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    // Ensure requireJwt has run or user info is available
    if (!req._userRole) {
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Unauthorized: missing role information' } })
    }

    if (!allowedRoles.includes(req._userRole)) {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Forbidden: insufficient permissions' } })
    }
    next()
  }
}

module.exports = { signAccessToken, requireJwt, requireRole }
