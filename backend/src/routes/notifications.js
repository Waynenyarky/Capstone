const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const notificationService = require('../services/notificationService')
const respond = require('../lib/respond')

/**
 * GET /api/notifications
 * Get user's notifications (paginated)
 * Query params: page, limit, unreadOnly
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const unreadOnly = req.query.unreadOnly === 'true'

    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly
    })

    return respond.success(res, result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return respond.error(res, 500, 'fetch_failed', error.message)
  }
})

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const count = await notificationService.getUnreadCount(userId)

    return respond.success(res, { count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return respond.error(res, 500, 'fetch_failed', error.message)
  }
})

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const notificationId = req.params.id

    const notification = await notificationService.markAsRead(notificationId, userId)

    return respond.success(res, notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    if (error.message.includes('not found')) {
      return respond.error(res, 404, 'not_found', error.message)
    }
    return respond.error(res, 500, 'update_failed', error.message)
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all user notifications as read
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const result = await notificationService.markAllAsRead(userId)

    return respond.success(res, {
      modifiedCount: result.modifiedCount,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return respond.error(res, 500, 'update_failed', error.message)
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const notificationId = req.params.id

    await notificationService.deleteNotification(notificationId, userId)

    return respond.success(res, { message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    if (error.message.includes('not found')) {
      return respond.error(res, 404, 'not_found', error.message)
    }
    return respond.error(res, 500, 'delete_failed', error.message)
  }
})

module.exports = router
