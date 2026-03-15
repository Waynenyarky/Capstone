import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  markAllNotificationsAsRead,
  getNotificationHistory,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  getPushNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification
} from '@/features/business-owner/services/notificationService.js'

// Mock the HTTP lib
vi.mock('@/lib/http.js', () => ({
  get: vi.fn(),
  post: vi.fn()
}))

import { get, post } from '@/lib/http.js'

// Mock browser APIs
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    pushManager: {
      getSubscription: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }
  })
}

const mockPushManager = {
  getSubscription: vi.fn(),
  subscribe: vi.fn()
}

const mockRegistration = {
  pushManager: mockPushManager
}

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn(() => Promise.resolve(mockRegistration)),
        ready: Promise.resolve(mockRegistration)
      },
      writable: true
    })
    
    // Mock PushManager
    Object.defineProperty(window, 'PushManager', {
      value: vi.fn(),
      writable: true
    })
    
    // Mock Notification
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: vi.fn(() => Promise.resolve('granted'))
      },
      writable: true
    })
    
    // Mock atob
    Object.defineProperty(window, 'atob', {
      value: vi.fn((str) => 'decoded_' + str),
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Notification Management', () => {
    it('should call getNotifications with correct endpoint', async () => {
      const mockResponse = {
        notifications: [
          { id: '1', title: 'Test', message: 'Test message', read: false }
        ],
        unreadCount: 1
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getNotifications(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/notifications/business-123')
      expect(result).toBe(mockResponse)
    })

    it('should call markNotificationAsRead with correct parameters', async () => {
      const mockResponse = { success: true, notification: { id: 'notif-123', read: true } }
      post.mockResolvedValue(mockResponse)

      const notificationId = 'notif-123'
      const result = await markNotificationAsRead(notificationId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/notif-123/read')
      expect(result).toBe(mockResponse)
    })

    it('should call deleteNotification with correct parameters', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const notificationId = 'notif-123'
      const result = await deleteNotification(notificationId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/notif-123/delete')
      expect(result).toBe(mockResponse)
    })

    it('should call markAllNotificationsAsRead with correct parameters', async () => {
      const mockResponse = { success: true, markedCount: 5 }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await markAllNotificationsAsRead(businessId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/read-all')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Notification Preferences', () => {
    it('should call getNotificationPreferences with correct endpoint', async () => {
      const mockResponse = {
        preferences: {
          email: true,
          push: false,
          sms: true,
          inApp: true,
          types: {
            payment_reminders: true,
            business_updates: false,
            compliance_alerts: true
          }
        }
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getNotificationPreferences(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/preferences')
      expect(result).toBe(mockResponse)
    })

    it('should call updateNotificationPreferences with correct parameters', async () => {
      const mockResponse = {
        success: true,
        preferences: {
          email: false,
          push: true,
          sms: false
        }
      }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const preferences = {
        email: false,
        push: true,
        sms: false,
        types: {
          payment_reminders: false
        }
      }
      const result = await updateNotificationPreferences(businessId, preferences)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/preferences', preferences)
      expect(result).toBe(mockResponse)
    })
  })

  describe('Notification History and Real-time', () => {
    it('should call getNotificationHistory with correct endpoint', async () => {
      const mockResponse = {
        history: [
          { id: '1', title: 'Payment Due', date: '2024-01-01', action: 'paid' },
          { id: '2', title: 'Document Required', date: '2024-01-02', action: 'uploaded' }
        ],
        pagination: { total: 2, page: 1 }
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getNotificationHistory(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/history')
      expect(result).toBe(mockResponse)
    })

    it('should call subscribeToNotifications with correct parameters', async () => {
      const mockResponse = { success: true, subscriptionId: 'sub-123' }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const socketId = 'socket-456'
      const result = await subscribeToNotifications(businessId, socketId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/subscribe', { socketId })
      expect(result).toBe(mockResponse)
    })

    it('should call unsubscribeFromNotifications with correct parameters', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const socketId = 'socket-456'
      const result = await unsubscribeFromNotifications(businessId, socketId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/unsubscribe', { socketId })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Push Notifications', () => {
    it('should register for push notifications successfully', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com',
        keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
        toJSON: vi.fn(() => ({ endpoint: 'https://push.example.com', keys: { auth: 'auth-key', p256dh: 'p256dh-key' } }))
      }

      mockPushManager.getSubscription.mockResolvedValue(null)
      mockPushManager.subscribe.mockResolvedValue(mockSubscription)

      const mockResponse = { success: true, subscriptionId: 'push-123' }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await registerForPushNotifications(businessId)

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
      expect(mockPushManager.subscribe).toHaveBeenCalled()
      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/push-register', {
        subscription: mockSubscription.toJSON()
      })
      expect(result).toBe(mockResponse)
    })

    it('should use existing push subscription if available', async () => {
      const mockExistingSubscription = {
        endpoint: 'https://push.example.com',
        toJSON: vi.fn(() => ({ endpoint: 'https://push.example.com' }))
      }

      mockPushManager.getSubscription.mockResolvedValue(mockExistingSubscription)

      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await registerForPushNotifications(businessId)

      expect(mockPushManager.subscribe).not.toHaveBeenCalled()
      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/push-register', {
        subscription: mockExistingSubscription.toJSON()
      })
      expect(result).toBe(mockResponse)
    })

    it('should throw error when push notifications not supported', async () => {
      // Remove PushManager from window
      delete window.PushManager
      delete navigator.serviceWorker

      const businessId = 'business-123'

      await expect(registerForPushNotifications(businessId)).rejects.toThrow(
        'Push notifications are not supported in this browser'
      )
    })

    it('should unregister from push notifications successfully', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com',
        unsubscribe: vi.fn(() => Promise.resolve(true)),
        toJSON: vi.fn(() => ({ endpoint: 'https://push.example.com' }))
      }

      mockPushManager.getSubscription.mockResolvedValue(mockSubscription)

      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await unregisterForPushNotifications(businessId)

      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/push-unregister', {
        subscription: mockSubscription.toJSON()
      })
      expect(result).toEqual({ success: true })
    })

    it('should handle unregister when no subscription exists', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null)

      const businessId = 'business-123'
      const result = await unregisterFromPushNotifications(businessId)

      expect(post).not.toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should call getPushNotifications with correct endpoint', async () => {
      const mockResponse = {
        notifications: [
          { id: '1', title: 'Push Test', body: 'Test push notification', data: {} }
        ]
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getPushNotifications(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/push-notifications')
      expect(result).toBe(mockResponse)
    })

    it('should handle getPushNotifications errors gracefully', async () => {
      const error = new Error('Network error')
      get.mockRejectedValue(error)

      const businessId = 'business-123'
      const result = await getPushNotifications(businessId)

      expect(result).toEqual({ notifications: [] })
    })
  })

  describe('Notification Permissions', () => {
    it('should get current notification permission', () => {
      const permission = getNotificationPermission()
      expect(permission).toBe('granted')
    })

    it('should return unsupported when Notification API not available', () => {
      // Mock window without Notification property
      const originalWindow = global.window
      global.window = { ...originalWindow, Notification: undefined }
      
      const permission = getNotificationPermission()
      expect(permission).toBe('unsupported')
      
      // Restore original
      global.window = originalWindow
    })

    it('should request notification permission successfully', async () => {
      const permission = await requestNotificationPermission()
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return unsupported when requesting permission on unsupported browser', async () => {
      // Mock window without Notification property
      const originalWindow = global.window
      global.window = { ...originalWindow, Notification: undefined }
      
      const permission = await requestNotificationPermission()
      expect(permission).toBe('unsupported')
      
      // Restore original
      global.window = originalWindow
    })
  })

  describe('Local Notifications', () => {
    it('should show local notification when permission granted', () => {
      const mockNotification = vi.fn()
      mockNotification.permission = 'granted'
      window.Notification = mockNotification

      showLocalNotification('Test Title', { body: 'Test body' })

      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        body: 'Test body'
      })
    })

    it('should not show local notification when permission not granted', () => {
      const mockNotification = vi.fn()
      mockNotification.permission = 'denied'
      window.Notification = mockNotification

      showLocalNotification('Test Title', { body: 'Test body' })

      expect(mockNotification).not.toHaveBeenCalled()
    })

    it('should not show local notification when Notification API not available', () => {
      // Mock window without Notification property
      const originalWindow = global.window
      global.window = { ...originalWindow, Notification: undefined }

      // Should not throw error
      expect(() => {
        showLocalNotification('Test Title')
      }).not.toThrow()
      
      // Restore original
      global.window = originalWindow
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors in getNotifications', async () => {
      const networkError = new Error('Network error')
      get.mockRejectedValue(networkError)

      await expect(getNotifications('business-123')).rejects.toThrow('Network error')
    })

    it('should handle API errors in markNotificationAsRead', async () => {
      const apiError = new Error('Notification not found')
      post.mockRejectedValue(apiError)

      await expect(markNotificationAsRead('notif-123')).rejects.toThrow('Notification not found')
    })

    it('should handle errors in updateNotificationPreferences', async () => {
      const error = new Error('Invalid preferences')
      post.mockRejectedValue(error)

      const preferences = { invalid: 'data' }
      await expect(updateNotificationPreferences('business-123', preferences)).rejects.toThrow('Invalid preferences')
    })

    it('should handle push notification registration errors', async () => {
      // Mock window without serviceWorker
      const originalWindow = global.window
      global.window = { ...originalWindow, navigator: { ...originalWindow.navigator, serviceWorker: undefined } }

      const businessId = 'business-123'

      await expect(registerForPushNotifications(businessId)).rejects.toThrow(
        'Push notifications are not supported in this browser'
      )
      
      // Restore original
      global.window = originalWindow
    })
  })

  describe('Parameter Validation', () => {
    it('should validate businessId parameter in getNotifications', async () => {
      const mockResponse = { notifications: [] }
      get.mockResolvedValue(mockResponse)

      const businessId = 'test-business-id'
      await getNotifications(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/notifications/test-business-id')
    })

    it('should validate notificationId parameter in markNotificationAsRead', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const notificationId = 'test-notification-id'
      await markNotificationAsRead(notificationId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/test-notification-id/read')
    })

    it('should validate socketId parameter in subscribeToNotifications', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const socketId = 'test-socket-id'
      await subscribeToNotifications(businessId, socketId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/subscribe', { socketId })
    })

    it('should validate preferences parameter in updateNotificationPreferences', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const preferences = { email: true, push: false }
      await updateNotificationPreferences(businessId, preferences)

      expect(post).toHaveBeenCalledWith('/api/business-owner/notifications/business-123/preferences', preferences)
    })
  })

  describe('Data Transformation', () => {
    it('should transform notifications response correctly', async () => {
      const mockResponse = {
        notifications: [
          { id: '1', title: 'Payment Due', message: 'Your payment is due', read: false, createdAt: '2024-01-01T00:00:00Z' },
          { id: '2', title: 'Document Approved', message: 'Your document was approved', read: true, createdAt: '2024-01-02T00:00:00Z' }
        ],
        unreadCount: 1,
        totalCount: 2
      }
      get.mockResolvedValue(mockResponse)

      const result = await getNotifications('business-123')

      expect(result.notifications).toHaveLength(2)
      expect(result.notifications[0].read).toBe(false)
      expect(result.notifications[1].read).toBe(true)
      expect(result.unreadCount).toBe(1)
      expect(result.totalCount).toBe(2)
    })

    it('should transform preferences response correctly', async () => {
      const mockResponse = {
        preferences: {
          email: true,
          push: false,
          sms: true,
          inApp: true,
          frequency: 'immediate',
          quietHours: { start: '22:00', end: '08:00' },
          types: {
            payment_reminders: { enabled: true, frequency: 'daily' },
            business_updates: { enabled: false, frequency: 'weekly' },
            compliance_alerts: { enabled: true, frequency: 'immediate' }
          }
        }
      }
      get.mockResolvedValue(mockResponse)

      const result = await getNotificationPreferences('business-123')

      expect(result.preferences.email).toBe(true)
      expect(result.preferences.push).toBe(false)
      expect(result.preferences.types.payment_reminders.enabled).toBe(true)
      expect(result.preferences.quietHours.start).toBe('22:00')
    })

    it('should transform history response correctly', async () => {
      const mockResponse = {
        history: [
          { id: '1', title: 'Payment Processed', date: '2024-01-01', status: 'completed', action: 'view_payment' },
          { id: '2', title: 'Document Uploaded', date: '2024-01-02', status: 'pending', action: 'review_document' }
        ],
        pagination: { total: 2, page: 1, totalPages: 1, hasNext: false, hasPrev: false }
      }
      get.mockResolvedValue(mockResponse)

      const result = await getNotificationHistory('business-123')

      expect(result.history).toHaveLength(2)
      expect(result.history[0].status).toBe('completed')
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.hasNext).toBe(false)
    })

    it('should handle empty responses gracefully', async () => {
      get.mockResolvedValue({})

      const result = await getNotifications('business-123')

      expect(result).toEqual({})
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle notification workflow', async () => {
      // Get notifications
      const notificationsResponse = {
        notifications: [
          { id: 'notif-1', title: 'Test', read: false }
        ],
        unreadCount: 1
      }
      get.mockResolvedValue(notificationsResponse)

      const notifications = await getNotifications('business-123')
      expect(notifications.unreadCount).toBe(1)

      // Mark as read
      const markReadResponse = { success: true, notification: { id: 'notif-1', read: true } }
      post.mockResolvedValue(markReadResponse)

      const marked = await markNotificationAsRead('notif-1')
      expect(marked.notification.read).toBe(true)

      // Get updated notifications
      const updatedResponse = {
        notifications: [
          { id: 'notif-1', title: 'Test', read: true }
        ],
        unreadCount: 0
      }
      get.mockResolvedValue(updatedResponse)

      const updated = await getNotifications('business-123')
      expect(updated.unreadCount).toBe(0)
    })

    it('should handle preference update workflow', async () => {
      // Get current preferences
      const currentPrefsResponse = {
        preferences: {
          email: true,
          push: false,
          types: { payment_reminders: true }
        }
      }
      get.mockResolvedValue(currentPrefsResponse)

      const current = await getNotificationPreferences('business-123')
      expect(current.preferences.email).toBe(true)

      // Update preferences
      const updateResponse = {
        success: true,
        preferences: {
          email: false,
          push: true,
          types: { payment_reminders: false }
        }
      }
      post.mockResolvedValue(updateResponse)

      const newPrefs = { email: false, push: true, types: { payment_reminders: false } }
      const updated = await updateNotificationPreferences('business-123', newPrefs)
      expect(updated.preferences.email).toBe(false)
      expect(updated.preferences.push).toBe(true)
    })

    it('should handle push notification lifecycle', async () => {
      // Check permission
      const permission = getNotificationPermission()
      expect(permission).toBe('granted')

      // Register for push
      const mockSubscription = {
        endpoint: 'https://push.example.com',
        toJSON: vi.fn(() => ({ endpoint: 'https://push.example.com' }))
      }
      mockPushManager.getSubscription.mockResolvedValue(null)
      mockPushManager.subscribe.mockResolvedValue(mockSubscription)

      const registerResponse = { success: true }
      post.mockResolvedValue(registerResponse)

      const registered = await registerForPushNotifications('business-123')
      expect(registered.success).toBe(true)

      // Get push notifications
      const pushResponse = {
        notifications: [
          { id: 'push-1', title: 'Push Test', body: 'Test message' }
        ]
      }
      get.mockResolvedValue(pushResponse)

      const pushNotifs = await getPushNotifications('business-123')
      expect(pushNotifs.notifications).toHaveLength(1)

      // Unregister
      mockSubscription.unsubscribe = vi.fn(() => Promise.resolve(true))
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription)

      const unregisterResponse = { success: true }
      post.mockResolvedValue(unregisterResponse)

      const unregistered = await unregisterFromPushNotifications('business-123')
      expect(unregistered.success).toBe(true)
    })
  })
})
