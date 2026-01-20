const Notification = require('../models/Notification')

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

module.exports = {
  createNotification
}
