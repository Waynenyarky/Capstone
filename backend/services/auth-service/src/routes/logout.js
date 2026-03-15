const express = require('express')
const { requireJwt } = require('../middleware/auth')
const inAppNotificationService = require('../services/notificationService')
const { createAuditLog } = require('../lib/auditLogger')
const Session = require('../models/Session')

const router = express.Router()

// POST /api/auth/logout — record "Signed out" in notification history before client clears token
router.post('/logout', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    
    // Try to get session start time for duration calculation
    let loginTime = null
    try {
      const session = await Session.findOne({ userId, isActive: true }).sort({ createdAt: -1 }).lean()
      if (session) {
        loginTime = session.createdAt
      }
    } catch (_) {}
    
    inAppNotificationService.createLogoutNotification(userId, { 
      userAgent: req.headers['user-agent'], 
      loginTime 
    }).catch((err) => console.error('Failed to create auth notification:', err))
    createAuditLog(userId, 'logout', 'session', 'active', 'ended', req._role || 'business_owner', { ip: req.ip }).catch(() => {})
    return res.json({ success: true })
  } catch (err) {
    console.error('POST /api/auth/logout error:', err)
    return res.status(500).json({ success: false, error: 'Logout failed' })
  }
})

module.exports = router
