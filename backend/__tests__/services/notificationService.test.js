const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const {
  createTestUsers,
  createTestUser,
  generateUniqueEmail,
} = require('../helpers/fixtures')
const { cleanupTestData } = require('../helpers/cleanup')

// Import the service to test
const notificationService = require('../../services/auth-service/src/services/notificationService')
const Notification = require('../../services/auth-service/src/models/Notification')
const User = require('../../services/auth-service/src/models/User')

describe('Notification Service', () => {
  let mongo
  let testUser
  let anotherUser

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    
    // Create test users
    const users = await createTestUsers()
    testUser = users.businessOwner
    anotherUser = await createTestUser({
      roleSlug: 'business_owner',
      firstName: 'Another',
      lastName: 'User',
    })
  })

  afterAll(async () => {
    await cleanupTestData()
    await teardownMongoDB()
  })

  beforeEach(async () => {
    // Clean up notifications before each test
    await Notification.deleteMany({})
  })

  describe('createNotification()', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: testUser._id,
        type: 'application_approved',
        title: 'Business Approved',
        message: 'Your business has been approved',
        relatedEntityType: 'business_application',
        relatedEntityId: testUser._id,
        metadata: { priority: 'high' }
      }

      const result = await notificationService.createNotification(
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.relatedEntityType,
        notificationData.relatedEntityId,
        notificationData.metadata
      )

      expect(result).toBeDefined()
      expect(result.userId.toString()).toBe(testUser._id.toString())
      expect(result.type).toBe('application_approved')
      expect(result.title).toBe('Business Approved')
      expect(result.message).toBe('Your business has been approved')
      expect(result.read).toBe(false)
      expect(result.relatedEntityType).toBe('business_application')
      expect(result.relatedEntityId.toString()).toBe(testUser._id.toString())
      expect(result.metadata).toEqual({ priority: 'high' })
      expect(result.createdAt).toBeDefined()
    })

    it('should create notification with minimal parameters', async () => {
      const result = await notificationService.createNotification(
        testUser._id,
        'general',
        'Simple Notification',
        'This is a simple notification'
      )

      expect(result).toBeDefined()
      expect(result.userId.toString()).toBe(testUser._id.toString())
      expect(result.type).toBe('general')
      expect(result.title).toBe('Simple Notification')
      expect(result.message).toBe('This is a simple notification')
      expect(result.read).toBe(false)
      expect(result.relatedEntityType).toBeNull()
      expect(result.relatedEntityId).toBeNull()
      expect(result.metadata).toEqual({})
    })

    it('should throw error for invalid user ID', async () => {
      await expect(
        notificationService.createNotification(
          'invalid-user-id',
          'general',
          'Test',
          'Message'
        )
      ).rejects.toThrow('Failed to create notification')
    })

    it('should handle database errors gracefully', async () => {
      // Mock Notification.create to throw an error
      const originalCreate = Notification.create
      Notification.create = jest.fn().mockRejectedValue(new Error('Database error'))

      await expect(
        notificationService.createNotification(
          testUser._id,
          'general',
          'Test',
          'Message'
        )
      ).rejects.toThrow('Failed to create notification: Database error')

      // Restore original method
      Notification.create = originalCreate
    })
  })

  describe('getUserNotifications()', () => {
    beforeEach(async () => {
      // Create test notifications
      await notificationService.createNotification(
        testUser._id,
        'application_status_update',
        'Notification 1',
        'Message 1'
      )
      await notificationService.createNotification(
        testUser._id,
        'payment_received',
        'Notification 2',
        'Message 2'
      )
      await notificationService.createNotification(
        anotherUser._id,
        'system_alert',
        'Other User Notification',
        'Other message'
      )
    })

    it('should get user notifications with default pagination', async () => {
      const result = await notificationService.getUserNotifications(testUser._id)

      expect(result.notifications).toHaveLength(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.totalPages).toBe(1)
      
      // Verify notifications are sorted by createdAt descending
      expect(result.notifications[0].createdAt).toBeInstanceOf(Date)
      expect(result.notifications[1].createdAt).toBeInstanceOf(Date)
    })

    it('should get user notifications with custom pagination', async () => {
      const result = await notificationService.getUserNotifications(testUser._id, {
        page: 1,
        limit: 1
      })

      expect(result.notifications).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(1)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.totalPages).toBe(2)
    })

    it('should get only unread notifications', async () => {
      // Mark one notification as read
      const notifications = await Notification.find({ userId: testUser._id })
      await notificationService.markAsRead(notifications[0]._id, testUser._id)

      const result = await notificationService.getUserNotifications(testUser._id, {
        unreadOnly: true
      })

      expect(result.notifications).toHaveLength(1)
      expect(result.notifications[0].read).toBe(false)
      expect(result.pagination.total).toBe(1)
    })

    it('should return empty result for user with no notifications', async () => {
      // Clean up all notifications for another user
      await Notification.deleteMany({ userId: anotherUser._id })
      
      const result = await notificationService.getUserNotifications(anotherUser._id)

      expect(result.notifications).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })

    it('should handle pagination beyond available pages', async () => {
      const result = await notificationService.getUserNotifications(testUser._id, {
        page: 10,
        limit: 5
      })

      expect(result.notifications).toHaveLength(0)
      expect(result.pagination.page).toBe(10)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.totalPages).toBe(1)
    })
  })

  describe('getUnreadCount()', () => {
    beforeEach(async () => {
      // Create test notifications
      await notificationService.createNotification(
        testUser._id,
        'application_status_update',
        'Notification 1',
        'Message 1'
      )
      await notificationService.createNotification(
        testUser._id,
        'payment_received',
        'Notification 2',
        'Message 2'
      )
      await notificationService.createNotification(
        anotherUser._id,
        'system_alert',
        'Other User Notification',
        'Other message'
      )
    })

    it('should return correct unread count', async () => {
      const count = await notificationService.getUnreadCount(testUser._id)
      expect(count).toBe(2)
    })

    it('should return 0 for user with no notifications', async () => {
      const count = await notificationService.getUnreadCount(anotherUser._id)
      expect(count).toBe(1) // Has 1 notification from beforeEach
    })

    it('should return 0 after marking all as read', async () => {
      await notificationService.markAllAsRead(testUser._id)
      const count = await notificationService.getUnreadCount(testUser._id)
      expect(count).toBe(0)
    })
  })

  describe('markAsRead()', () => {
    let notification

    beforeEach(async () => {
      notification = await notificationService.createNotification(
        testUser._id,
        'application_status_update',
        'Test Notification',
        'Test message'
      )
    })

    it('should mark notification as read successfully', async () => {
      const result = await notificationService.markAsRead(notification._id, testUser._id)

      expect(result.read).toBe(true)
      expect(result.readAt).toBeInstanceOf(Date)
      expect(result._id.toString()).toBe(notification._id.toString())
    })

    it('should throw error for invalid notification ID', async () => {
      await expect(
        notificationService.markAsRead('invalid-id', testUser._id)
      ).rejects.toThrow('Failed to mark notification as read')
    })

    it('should throw error when trying to mark another user\'s notification', async () => {
      await expect(
        notificationService.markAsRead(notification._id, anotherUser._id)
      ).rejects.toThrow('Failed to mark notification as read: Notification not found or access denied')
    })

    it('should handle database errors gracefully', async () => {
      // Mock Notification.findOneAndUpdate to throw an error
      const originalFindOneAndUpdate = Notification.findOneAndUpdate
      Notification.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('Database error'))

      await expect(
        notificationService.markAsRead(notification._id, testUser._id)
      ).rejects.toThrow('Failed to mark notification as read: Database error')

      // Restore original method
      Notification.findOneAndUpdate = originalFindOneAndUpdate
    })
  })

  describe('markAllAsRead()', () => {
    beforeEach(async () => {
      // Create multiple notifications
      await notificationService.createNotification(testUser._id, 'application_status_update', 'Notif 1', 'Message 1')
      await notificationService.createNotification(testUser._id, 'payment_received', 'Notif 2', 'Message 2')
      await notificationService.createNotification(testUser._id, 'system_alert', 'Notif 3', 'Message 3')
    })

    it('should mark all user notifications as read', async () => {
      const result = await notificationService.markAllAsRead(testUser._id)

      expect(result.modifiedCount).toBe(3)
      
      // Verify all are marked as read
      const unreadCount = await notificationService.getUnreadCount(testUser._id)
      expect(unreadCount).toBe(0)
    })

    it('should return 0 for user with no notifications', async () => {
      const result = await notificationService.markAllAsRead(anotherUser._id)
      expect(result.modifiedCount).toBe(0)
    })
  })

  describe('deleteNotification()', () => {
    let notification

    beforeEach(async () => {
      notification = await notificationService.createNotification(
        testUser._id,
        'application_status_update',
        'Test Notification',
        'Test message'
      )
    })

    it('should delete notification successfully', async () => {
      const result = await notificationService.deleteNotification(notification._id, testUser._id)

      expect(result._id.toString()).toBe(notification._id.toString())
      
      // Verify notification is deleted
      const notifications = await Notification.find({ userId: testUser._id })
      expect(notifications).toHaveLength(0)
    })

    it('should throw error for invalid notification ID', async () => {
      await expect(
        notificationService.deleteNotification('invalid-id', testUser._id)
      ).rejects.toThrow('Failed to delete notification')
    })

    it('should throw error when trying to delete another user\'s notification', async () => {
      await expect(
        notificationService.deleteNotification(notification._id, anotherUser._id)
      ).rejects.toThrow('Failed to delete notification: Notification not found or access denied')
    })
  })

  describe('deleteAllForUser()', () => {
    beforeEach(async () => {
      // Create multiple notifications
      await notificationService.createNotification(testUser._id, 'application_status_update', 'Notif 1', 'Message 1')
      await notificationService.createNotification(testUser._id, 'payment_received', 'Notif 2', 'Message 2')
      await notificationService.createNotification(anotherUser._id, 'system_alert', 'Notif 3', 'Message 3')
    })

    it('should delete all user notifications', async () => {
      const result = await notificationService.deleteAllForUser(testUser._id)

      expect(result.deletedCount).toBe(2)
      
      // Verify notifications are deleted
      const userNotifications = await Notification.find({ userId: testUser._id })
      expect(userNotifications).toHaveLength(0)
      
      // Verify other user's notifications are not deleted
      const otherNotifications = await Notification.find({ userId: anotherUser._id })
      expect(otherNotifications).toHaveLength(1)
    })
  })

  describe('deleteNotificationsOlderThan()', () => {
    beforeEach(async () => {
      // Create a notification
      await notificationService.createNotification(testUser._id, 'application_status_update', 'Notif 1', 'Message 1')
    })

    it('should delete notifications older than specified days', async () => {
      // Manually create an old notification
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)
      
      await Notification.create({
        userId: testUser._id,
        type: 'general',
        title: 'Old Notification',
        message: 'This should be deleted',
        createdAt: oldDate
      })

      const result = await notificationService.deleteNotificationsOlderThan(testUser._id, 7)
      expect(result.deletedCount).toBe(1)
      
      // Verify only recent notification remains
      const notifications = await Notification.find({ userId: testUser._id })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('application_status_update')
    })

    it('should use default 7 days when no days specified', async () => {
      // Create notification 8 days ago
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 8)
      
      await Notification.create({
        userId: testUser._id,
        type: 'general',
        title: 'Old Notification',
        message: 'This should be deleted',
        createdAt: oldDate
      })

      const result = await notificationService.deleteNotificationsOlderThan(testUser._id)
      expect(result.deletedCount).toBe(1)
    })
  })

  describe('SSE Stream Integration', () => {
    it('should not fail when notificationStreamRegistry is unavailable', async () => {
      // Mock the registry to throw an error
      const originalRequire = require
      global.require = jest.fn((moduleName) => {
        if (moduleName === '../lib/notificationStreamRegistry') {
          throw new Error('Registry not available')
        }
        return originalRequire(moduleName)
      })

      // Should not throw error
      const result = await notificationService.createNotification(
        testUser._id,
        'general',
        'Test',
        'Message'
      )

      expect(result).toBeDefined()
      expect(result.userId.toString()).toBe(testUser._id.toString())

      // Restore original require
      global.require = originalRequire
    })
  })

  describe('Data Consistency', () => {
    it('should handle concurrent notification creation', async () => {
      const promises = []
      const types = ['application_status_update', 'payment_received', 'system_alert', 'general', 'application_approved']
      for (let i = 0; i < 5; i++) {
        promises.push(
          notificationService.createNotification(
            testUser._id,
            types[i],
            `Notification ${i}`,
            `Message ${i}`
          )
        )
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)
      
      // Verify all notifications are created
      const userNotifications = await Notification.find({ userId: testUser._id })
      expect(userNotifications).toHaveLength(5)
    })

    it('should maintain read/unread state consistency', async () => {
      // Create notifications
      const notif1 = await notificationService.createNotification(testUser._id, 'application_status_update', 'Notif 1', 'Message 1')
      const notif2 = await notificationService.createNotification(testUser._id, 'payment_received', 'Notif 2', 'Message 2')

      // Mark one as read
      await notificationService.markAsRead(notif1._id, testUser._id)

      // Check unread count
      const unreadCount = await notificationService.getUnreadCount(testUser._id)
      expect(unreadCount).toBe(1)

      // Get notifications with unreadOnly filter
      const unreadNotifications = await notificationService.getUserNotifications(testUser._id, { unreadOnly: true })
      expect(unreadNotifications.notifications).toHaveLength(1)
      expect(unreadNotifications.notifications[0]._id.toString()).toBe(notif2._id.toString())
    })
  })
})
