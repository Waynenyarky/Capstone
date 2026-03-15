const Notification = require('../models/Notification')

/**
 * Notification Service
 * Handles creating and managing user notifications
 */

/**
 * Create a new notification
 * @param {string|ObjectId} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} relatedEntityType - Related entity type (optional)
 * @param {string} relatedEntityId - Related entity ID (optional)
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<object>} Created notification
 */
async function createNotification(userId, type, title, message, relatedEntityType = null, relatedEntityId = null, metadata = {}) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      metadata,
      read: false
    })
    // Fire-and-forget: push to SSE stream so connected clients get real-time update
    try {
      const registry = require('../lib/notificationStreamRegistry')
      const payload = notification.toObject ? notification.toObject() : { ...notification }
      setImmediate(() => {
        registry.push(String(userId), { type: 'new', notification: payload })
      })
    } catch (_) { /* ignore if registry unavailable (e.g. in tests) */ }
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error(`Failed to create notification: ${error.message}`)
  }
}

const NOTIFICATION_MAX_AGE_DAYS = 7

/**
 * Delete notifications older than the given number of days for a user
 * @param {string|ObjectId} userId - User ID
 * @param {number} days - Delete notifications older than this many days (default: 7)
 * @returns {Promise<object>} Deletion result
 */
async function deleteNotificationsOlderThan(userId, days = NOTIFICATION_MAX_AGE_DAYS) {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const result = await Notification.deleteMany({
      userId,
      createdAt: { $lt: cutoff }
    })
    return result
  } catch (error) {
    console.error('Error deleting old notifications:', error)
    throw new Error(`Failed to delete old notifications: ${error.message}`)
  }
}

/**
 * Get user notifications with pagination (only returns notifications from the last 7 days)
 * Automatically deletes notifications older than 7 days when fetching
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {boolean} options.unreadOnly - Only return unread notifications (default: false)
 * @returns {Promise<object>} Notifications with pagination info
 */
async function getUserNotifications(userId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false
    } = options

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_MAX_AGE_DAYS)

    const query = { userId, createdAt: { $gte: cutoff } }
    if (unreadOnly) {
      query.read = false
    }

    await deleteNotificationsOlderThan(userId, NOTIFICATION_MAX_AGE_DAYS)

    const skip = (page - 1) * limit
    const total = await Notification.countDocuments(query)

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error getting user notifications:', error)
    throw new Error(`Failed to get notifications: ${error.message}`)
  }
}

/**
 * Get count of unread notifications for a user (only last 7 days)
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_MAX_AGE_DAYS)
    const count = await Notification.countDocuments({
      userId,
      read: false,
      createdAt: { $gte: cutoff }
    })
    return count
  } catch (error) {
    console.error('Error getting unread count:', error)
    throw new Error(`Failed to get unread count: ${error.message}`)
  }
}

/**
 * Mark notification as read
 * @param {string|ObjectId} notificationId - Notification ID
 * @param {string|ObjectId} userId - User ID (for security)
 * @returns {Promise<object>} Updated notification
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    )

    if (!notification) {
      throw new Error('Notification not found or access denied')
    }

    return notification
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error(`Failed to mark notification as read: ${error.message}`)
  }
}

/**
 * Mark all user notifications as read
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<object>} Update result
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    )
    return result
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error(`Failed to mark all notifications as read: ${error.message}`)
  }
}

/**
 * Delete a notification
 * @param {string|ObjectId} notificationId - Notification ID
 * @param {string|ObjectId} userId - User ID (for security)
 * @returns {Promise<object>} Deletion result
 */
async function deleteNotification(notificationId, userId) {
  try {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    })

    if (!result) {
      throw new Error('Notification not found or access denied')
    }

    return result
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw new Error(`Failed to delete notification: ${error.message}`)
  }
}

/**
 * Delete all notifications for a user (within the same 7-day window as the list)
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<object>} Deletion result with deletedCount
 */
async function deleteAllForUser(userId) {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_MAX_AGE_DAYS)
    const result = await Notification.deleteMany({
      userId,
      createdAt: { $gte: cutoff }
    })
    return result
  } catch (error) {
    console.error('Error deleting all notifications:', error)
    throw new Error(`Failed to delete all notifications: ${error.message}`)
  }
}

/**
 * Parse user agent to get a friendly device/browser description
 * @param {string} userAgent - User agent string
 * @returns {string} Friendly device description
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return 'Unknown device'
  const ua = userAgent.toLowerCase()
  
  // Detect browser
  let browser = 'Unknown browser'
  if (ua.includes('edg/')) browser = 'Microsoft Edge'
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'
  
  // Detect OS/device
  let device = ''
  if (ua.includes('iphone')) device = 'iPhone'
  else if (ua.includes('ipad')) device = 'iPad'
  else if (ua.includes('android')) device = 'Android'
  else if (ua.includes('windows')) device = 'Windows'
  else if (ua.includes('macintosh') || ua.includes('mac os')) device = 'Mac'
  else if (ua.includes('linux')) device = 'Linux'
  
  if (device && browser !== 'Unknown browser') {
    return `${browser} on ${device}`
  }
  return device || browser
}

/**
 * Format date/time for notification messages
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateTime(date) {
  const d = date || new Date()
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Create a login notification with context
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - Options
 * @param {boolean} options.isFirstLogin - Whether this is the user's first login
 * @param {string} options.userAgent - User agent string
 * @param {string} options.ip - IP address
 * @param {string} options.method - Login method (email_otp, totp, passkey, google)
 * @returns {Promise<object>} Created notification
 */
async function createLoginNotification(userId, options = {}) {
  const { isFirstLogin = false, userAgent = '', ip = '', method = '' } = options
  const device = parseUserAgent(userAgent)
  const time = formatDateTime(new Date())
  
  let title, message
  if (isFirstLogin) {
    title = 'Welcome to BizClear!'
    message = `Your account has been created successfully. You're now signed in on ${device}.`
  } else {
    title = 'Signed in'
    message = `You signed in on ${device} at ${time}.`
  }
  
  return createNotification(userId, 'auth_login', title, message, null, null, {
    device,
    ip,
    method,
    isFirstLogin,
    timestamp: new Date().toISOString()
  })
}

/**
 * Create a logout notification with session info
 * @param {string|ObjectId} userId - User ID
 * @param {object} options - Options
 * @param {string} options.userAgent - User agent string
 * @param {Date} options.loginTime - When the session started
 * @returns {Promise<object>} Created notification
 */
async function createLogoutNotification(userId, options = {}) {
  const { userAgent = '', loginTime = null } = options
  const device = parseUserAgent(userAgent)
  const time = formatDateTime(new Date())
  
  let message = `You signed out on ${device} at ${time}.`
  
  // Add session duration if we know when they logged in
  if (loginTime) {
    const durationMs = Date.now() - new Date(loginTime).getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      message += ` Session lasted ${hours}h ${minutes}m.`
    } else if (minutes > 0) {
      message += ` Session lasted ${minutes} minute${minutes !== 1 ? 's' : ''}.`
    }
  }
  
  return createNotification(userId, 'auth_logout', 'Signed out', message, null, null, {
    device,
    timestamp: new Date().toISOString()
  })
}

/**
 * Create a security-related notification
 * @param {string|ObjectId} userId - User ID
 * @param {string} action - Action type (mfa_enabled, mfa_disabled, passkey_added, passkey_removed, email_changed)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Created notification
 */
async function createSecurityNotification(userId, action, options = {}) {
  const { userAgent = '', ip = '' } = options
  const device = parseUserAgent(userAgent)
  const time = formatDateTime(new Date())
  
  const notifications = {
    mfa_enabled: {
      type: 'auth_mfa_enabled',
      title: 'MFA enabled',
      message: `Two-factor authentication has been enabled on your account at ${time}.`
    },
    mfa_disabled: {
      type: 'auth_mfa_disabled',
      title: 'MFA disabled',
      message: `Two-factor authentication has been disabled on your account at ${time}. Your account may be less secure.`
    },
    passkey_added: {
      type: 'auth_passkey_added',
      title: 'Passkey added',
      message: `A new passkey was registered to your account at ${time} from ${device}.`
    },
    passkey_removed: {
      type: 'auth_passkey_removed',
      title: 'Passkey removed',
      message: `A passkey was removed from your account at ${time}.`
    },
    email_changed: {
      type: 'auth_email_changed',
      title: 'Email changed',
      message: `Your email address was changed at ${time}. If you didn't make this change, please contact support immediately.`
    },
    session_invalidated: {
      type: 'auth_session_invalidated',
      title: 'Sessions invalidated',
      message: `All your sessions have been signed out at ${time} due to a security change.`
    }
  }
  
  const notif = notifications[action]
  if (!notif) {
    console.warn(`Unknown security notification action: ${action}`)
    return null
  }
  
  return createNotification(userId, notif.type, notif.title, notif.message, null, null, {
    device,
    ip,
    action,
    timestamp: new Date().toISOString()
  })
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllForUser,
  deleteNotificationsOlderThan,
  // New contextual notification helpers
  createLoginNotification,
  createLogoutNotification,
  createSecurityNotification,
  parseUserAgent,
  formatDateTime
}
