const express = require('express')
const User = require('../../models/User')
const Session = require('../../models/Session')
const { requireJwt } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { createAuditLog } = require('../../lib/auditLogger')
const { trackIP } = require('../../lib/ipTracker')
const { isAdminRole } = require('../../lib/roleHelpers')

const router = express.Router()

// Session timeout durations (in milliseconds)
const SESSION_TIMEOUT_BUSINESS_OWNER = 60 * 60 * 1000 // 1 hour
const SESSION_TIMEOUT_STAFF = 60 * 60 * 1000 // 1 hour
const SESSION_TIMEOUT_ADMIN = 10 * 60 * 1000 // 10 minutes

/**
 * Get session timeout duration based on user role
 */
function getSessionTimeout(roleSlug) {
  if (isAdminRole(roleSlug)) {
    return SESSION_TIMEOUT_ADMIN
  }
  // Business Owner and Staff both get 1 hour
  return SESSION_TIMEOUT_BUSINESS_OWNER
}

// POST /api/auth/session/activity
// Update last activity timestamp for current session
router.post('/session/activity', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    const tokenVersion = req._tokenVersion || 0
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Find or create session
    let session = await Session.findOne({
      userId,
      tokenVersion,
      isActive: true,
    })

    if (!session) {
      // Create new session
      const user = await User.findById(userId).populate('role').lean()
      if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

      const roleSlug = user.role?.slug || 'user'
      const timeout = getSessionTimeout(roleSlug)
      const expiresAt = new Date(Date.now() + timeout)

      session = await Session.create({
        userId,
        tokenVersion,
        ipAddress,
        userAgent,
        lastActivityAt: new Date(),
        expiresAt,
        isActive: true,
      })
    } else {
      // Update activity
      await session.updateActivity()
    }

    return res.json({
      success: true,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
    })
  } catch (err) {
    console.error('POST /api/auth/session/activity error:', err)
    return respond.error(res, 500, 'activity_update_failed', 'Failed to update session activity')
  }
})

// GET /api/auth/session/active
// Get all active sessions for current user
router.get('/session/active', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    const currentTokenVersion = req._tokenVersion || 0

    const sessions = await Session.find({
      userId,
      isActive: true,
    })
      .sort({ lastActivityAt: -1 })
      .lean()

    const sessionsList = sessions.map((session) => ({
      id: String(session._id),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceInfo: session.deviceInfo,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrentSession: session.tokenVersion === currentTokenVersion,
      isExpired: Date.now() > session.expiresAt.getTime(),
    }))

    return res.json({ sessions: sessionsList })
  } catch (err) {
    console.error('GET /api/auth/session/active error:', err)
    return respond.error(res, 500, 'fetch_failed', 'Failed to fetch active sessions')
  }
})

// POST /api/auth/session/invalidate
// Invalidate a specific session
const invalidateSessionSchema = Joi.object({
  sessionId: Joi.string().required(),
})
router.post('/session/invalidate', requireJwt, validateBody(invalidateSessionSchema), async (req, res) => {
  try {
    const userId = req._userId
    const { sessionId } = req.body || {}
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const session = await Session.findOne({
      _id: sessionId,
      userId, // Ensure user can only invalidate their own sessions
    })

    if (!session) {
      return respond.error(res, 404, 'session_not_found', 'Session not found')
    }

    await session.invalidate('manual')

    // Log to audit trail
    const user = await User.findById(userId).populate('role').lean()
    const roleSlug = user?.role?.slug || 'user'
    await createAuditLog(
      userId,
      'session_invalidated',
      'session',
      '',
      'session_manually_invalidated',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        sessionId: String(session._id),
      }
    )

    return res.json({ success: true, message: 'Session invalidated' })
  } catch (err) {
    console.error('POST /api/auth/session/invalidate error:', err)
    return respond.error(res, 500, 'invalidation_failed', 'Failed to invalidate session')
  }
})

// POST /api/auth/session/invalidate-all
// Invalidate all sessions for current user (except current)
router.post('/session/invalidate-all', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    const currentTokenVersion = req._tokenVersion || 0
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Invalidate all sessions except current
    const result = await Session.updateMany(
      {
        userId,
        isActive: true,
        tokenVersion: { $ne: currentTokenVersion },
      },
      {
        $set: {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: 'manual_all',
        },
      }
    )

    // Log to audit trail
    const user = await User.findById(userId).populate('role').lean()
    const roleSlug = user?.role?.slug || 'user'
    await createAuditLog(
      userId,
      'session_invalidated',
      'session',
      '',
      'all_sessions_invalidated',
      roleSlug,
      {
        ip: ipAddress,
        userAgent,
        sessionsInvalidated: result.modifiedCount,
      }
    )

    return res.json({
      success: true,
      message: `Invalidated ${result.modifiedCount} session(s)`,
      sessionsInvalidated: result.modifiedCount,
    })
  } catch (err) {
    console.error('POST /api/auth/session/invalidate-all error:', err)
    return respond.error(res, 500, 'invalidation_failed', 'Failed to invalidate sessions')
  }
})

module.exports = router
