const express = require('express')
const router = express.Router()
const { requireJwt } = require('../middleware/auth')

// Use local notification service (auth service has its own copy)
const notificationService = require('../services/notificationService')
const streamRegistry = require('../lib/notificationStreamRegistry')

// Try to use respond helper
let respond
try {
  respond = require('../middleware/respond')
} catch {
  respond = {
    success: (res, status, data) => res.status(status).json(data),
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

    return respond.success(res, 200, result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return respond.error(res, 500, 'fetch_failed', error.message)
  }
})

/**
 * POST /api/notifications/stream-token
 * Issue a short-lived one-time token for opening the SSE stream (EventSource cannot send Authorization header).
 */
router.post('/stream-token', requireJwt, (req, res) => {
  const userId = req._userId
  if (!userId) {
    return respond.error(res, 401, 'unauthorized', 'User ID not found')
  }
  try {
    const { streamToken, expiresIn } = streamRegistry.issueStreamToken(userId)
    return respond.success(res, 200, { streamToken, expiresIn })
  } catch (err) {
    console.error('Error issuing stream token:', err)
    return respond.error(res, 500, 'token_failed', 'Failed to issue stream token')
  }
})

/**
 * GET /api/notifications/stream?token=<streamToken>
 * SSE endpoint. Validates one-time token, then keeps connection open and pushes new notification events.
 */
router.get('/stream', (req, res) => {
  const token = req.query.token
  const userId = streamRegistry.consumeStreamToken(token)
  if (!userId) {
    return respond.error(res, 401, 'invalid_token', 'Invalid or expired stream token')
  }
  streamRegistry.register(userId, res)
  // Connection kept open; client will receive events until close. Cleanup on res.on('close') in register().
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

    return respond.success(res, 200, { count })
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

    return respond.success(res, 200, notification)
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

    return respond.success(res, 200, {
      modifiedCount: result.modifiedCount,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return respond.error(res, 500, 'update_failed', error.message)
  }
})

/**
 * DELETE /api/notifications/all
 * Delete all notifications for the current user (same 7-day window as list)
 */
router.delete('/all', requireJwt, async (req, res) => {
  if (!notificationService) {
    return respond.error(res, 500, 'service_unavailable', 'Notification service not available')
  }

  try {
    const userId = req._userId
    if (!userId) {
      return respond.error(res, 401, 'unauthorized', 'User ID not found')
    }

    const result = await notificationService.deleteAllForUser(userId)

    return respond.success(res, 200, {
      deletedCount: result.deletedCount,
      message: 'All notifications cleared'
    })
  } catch (error) {
    console.error('Error clearing all notifications:', error)
    return respond.error(res, 500, 'delete_failed', error.message)
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

    return respond.success(res, 200, { message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return respond.error(res, 404, 'not_found', error.message)
    }
    return respond.error(res, 500, 'delete_failed', error.message)
  }
})

// POST /api/notifications/internal-push (cross-service SSE push)
router.post('/internal-push', async (req, res) => {
  const internalKey = req.headers['x-internal-key']
  if (internalKey !== process.env.INTERNAL_SERVICE_KEY && process.env.INTERNAL_SERVICE_KEY) {
    return respond.error(res, 403, 'forbidden', 'Invalid internal key')
  }
  const { userId, notification } = req.body
  if (!userId || !notification) {
    return respond.error(res, 400, 'invalid_body', 'userId and notification required')
  }
  try {
    streamRegistry.push(String(userId), { type: 'new', notification })
  } catch (e) {
    console.warn('[internal-push] SSE push failed:', e.message)
  }
  return respond.success(res, 200, { pushed: true })
})

module.exports = router
