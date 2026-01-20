import { fetchJsonWithFallback } from '@/lib/http'

/**
 * Notification Service
 * Handles fetching and managing user notifications
 */

/**
 * Get user notifications
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {boolean} options.unreadOnly - Only return unread notifications (default: false)
 * @returns {Promise<object>} Notifications with pagination info
 */
export async function getNotifications(options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  if (unreadOnly) {
    params.append('unreadOnly', 'true')
  }
  
  return fetchJsonWithFallback(`/api/notifications?${params.toString()}`)
}

/**
 * Get unread notification count
 * @returns {Promise<number>} Count of unread notifications
 */
export async function getUnreadCount() {
  const response = await fetchJsonWithFallback('/api/notifications/unread-count')
  return response.count || 0
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<object>} Updated notification
 */
export async function markAsRead(notificationId) {
  return fetchJsonWithFallback(`/api/notifications/${notificationId}/read`, {
    method: 'PUT'
  })
}

/**
 * Mark all notifications as read
 * @returns {Promise<object>} Update result
 */
export async function markAllAsRead() {
  return fetchJsonWithFallback('/api/notifications/read-all', {
    method: 'PUT'
  })
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<object>} Deletion result
 */
export async function deleteNotification(notificationId) {
  return fetchJsonWithFallback(`/api/notifications/${notificationId}`, {
    method: 'DELETE'
  })
}
