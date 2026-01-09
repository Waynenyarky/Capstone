const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const { requireJwt, signAccessToken } = require('../../middleware/auth')
const { sendVerificationEmail } = require('../../lib/mailer')
const respond = require('../../middleware/respond')

const router = express.Router()

// POST /api/auth/send-verification-email
router.post('/send-verification-email', requireJwt, async (req, res) => {
  try {
    const user = await User.findById(req._userId)
    if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')
    if (user.isEmailVerified) return respond.error(res, 400, 'already_verified', 'Email already verified')

    const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
    const token = jwt.sign(
      { sub: user.id, purpose: 'email-verification' },
      secret,
      { expiresIn: '1d' }
    )

    // Frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const link = `${frontendUrl}/verify-email?token=${token}`

    await sendVerificationEmail({ to: user.email, link })
    
    return res.json({ sent: true, message: 'Verification email sent' })
  } catch (err) {
    console.error('POST /send-verification-email error:', err)
    return respond.error(res, 500, 'send_failed', 'Failed to send verification email')
  }
})

// POST /api/auth/verify-email-token
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return respond.error(res, 400, 'missing_token', 'Missing token')

    const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
    let decoded
    try {
      decoded = jwt.verify(token, secret)
    } catch (e) {
      return respond.error(res, 400, 'invalid_token', 'Invalid or expired token')
    }

    if (decoded.purpose !== 'email-verification') {
      return respond.error(res, 400, 'invalid_token_purpose', 'Invalid token purpose')
    }

    const user = await User.findById(decoded.sub)
    if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

    if (!user.isEmailVerified) {
      user.isEmailVerified = true
      await user.save()
    }

    const safe = {
      id: String(user._id),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      termsAccepted: user.termsAccepted,
      createdAt: user.createdAt,
      isEmailVerified: true,
      avatarUrl: user.avatarUrl || '',
    }

    try {
      const { token, expiresAtMs } = signAccessToken(user)
      safe.token = token
      safe.expiresAt = new Date(expiresAtMs).toISOString()
    } catch (_) {}

    return res.json({ verified: true, user: safe })
  } catch (err) {
    console.error('POST /verify-email-token error:', err)
    return respond.error(res, 500, 'verification_failed', 'Failed to verify email')
  }
})

module.exports = router
