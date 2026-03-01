const express = require('express')
const { requireJwt } = require('../middleware/auth')
const inAppNotificationService = require('../services/notificationService')
const { createAuditLog } = require('../lib/auditLogger')

const router = express.Router()

// POST /api/auth/logout — record "Signed out" in notification history before client clears token
router.post('/logout', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    inAppNotificationService.createNotification(userId, 'auth_logout', 'Signed out', 'You have been signed out successfully.').catch((err) => console.error('Failed to create auth notification:', err))
    createAuditLog(userId, 'logout', 'session', 'active', 'ended', req._role || 'business_owner', { ip: req.ip }).catch(() => {})
    return res.json({ success: true })
  } catch (err) {
    console.error('POST /api/auth/logout error:', err)
    return res.status(500).json({ success: false, error: 'Logout failed' })
  }
})

module.exports = router
