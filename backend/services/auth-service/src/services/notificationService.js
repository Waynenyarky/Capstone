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
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error(`Failed to create notification: ${error.message}`)
  }
}

/**
 * Get user notifications with pagination
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

    const query = { userId }
    if (unreadOnly) {
      query.read = false
    }

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
 * Get count of unread notifications for a user
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false
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

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
}
