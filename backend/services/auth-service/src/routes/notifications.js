const express = require('express')
const router = express.Router()
const { requireJwt } = require('../middleware/auth')

// Use local notification service (auth service has its own copy)
const notificationService = require('../services/notificationService')

// Try to use respond helper
let respond
try {
  respond = require('../../src/lib/respond')
} catch {
  respond = {
    success: (res, data) => res.json({ ok: true, ...data }),
    error: (res, status, code, message) => res.status(status).json({ ok: false, error: { code, message } })
  }
}

/**
 * GET /api/notifications
 * Get user's notifications (paginated)
 * Query params: page, limit, unreadOnly
 */
router.get('/', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }
  
  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }
    
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
router.get('/unread-count', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }
  
  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }
    
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
router.put('/:id/read', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }
  
  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }
    
    const notificationId = req.params.id

    // Validate that the ID is a valid MongoDB ObjectId
    const mongoose = require('mongoose')
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return respond.error(res, 400, 'invalid_id', 'Invalid notification ID')
    }

    const notification = await notificationService.markAsRead(notificationId, userId)

    return respond.success(res, notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return respond.error(res, 404, 'not_found', error.message)
    }
    return respond.error(res, 500, 'update_failed', error.message)
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all user notifications as read
 */
router.put('/read-all', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }
  
  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }
    
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
router.delete('/:id', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }
  
  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }
    
    const notificationId = req.params.id

    // Validate that the ID is a valid MongoDB ObjectId
    const mongoose = require('mongoose')
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return respond.error(res, 400, 'invalid_id', 'Invalid notification ID')
    }

    await notificationService.deleteNotification(notificationId, userId)

    return respond.success(res, { message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return respond.error(res, 404, 'not_found', error.message)
    }
    return respond.error(res, 500, 'delete_failed', error.message)
  }
})

module.exports = router
