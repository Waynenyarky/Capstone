const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { getEffectiveInspectorId } = require('./resolveInspector')
const notificationService = require('../../services/notificationService')
const Notification = require('../../models/Notification')

const INSPECTOR_NOTIFICATION_TYPES = ['inspection_assigned', 'inspection_schedule_changed', 'appeal_outcome']

/**
 * GET /api/inspector/notifications
 * Inspector-specific notifications (assignments, schedule changes, appeal outcomes)
 */
router.get('/', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const userId = await getEffectiveInspectorId(req)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const unreadOnly = req.query.unreadOnly === 'true'
    const inspectorOnly = req.query.inspectorOnly !== 'false'

    if (inspectorOnly) {
      const query = { userId }
      if (unreadOnly) query.read = false
      query.type = { $in: INSPECTOR_NOTIFICATION_TYPES }

      const skip = (page - 1) * limit
      const total = await Notification.countDocuments(query)
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      return respond.success(res, 200, {
        notifications,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      })
    }

    const result = await notificationService.getUserNotifications(userId, { page, limit, unreadOnly })
    return respond.success(res, 200, result)
  } catch (error) {
    console.error('Error fetching inspector notifications:', error)
    return respond.error(res, 500, 'fetch_failed', error.message)
  }
})

module.exports = router
